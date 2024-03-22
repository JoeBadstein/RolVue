from flask import Flask, request, jsonify, render_template
from flask import session as fsession
import smtplib
import os
import random
from flask_cors import CORS
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from itsdangerous import URLSafeTimedSerializer
from replit import db
import re

app = Flask(__name__)
cors = CORS(app, supports_credentials=True)

app.secret_key = os.getenv('SECURE_KEY')
s = URLSafeTimedSerializer(app.secret_key, salt='phone-verification')

def send_email(message, from_addr, to_addr, password):  
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(from_addr, password)
    server.sendmail(from_addr, to_addr, f"\n{message}")
    server.quit()

@app.route('/set_spots')
def set_spots():
    fsession['spots_left'] = len(list(db.keys()))
    return str(len(list(db.keys())))

@app.route('/api/checkID')
def checkID():
    ID = request.args.get("id")
    if ID in db.keys():
        return jsonify({"status": True})
    else:
        return jsonify({"status": False})
      
@app.route('/api/validate_phone', methods=['POST'])
def validate_phone():
    phone_number = request.form.get('phone_number')
    carrier = request.form.get('carrier')
    choices = ["lunch", "after ninth"]
    # Generate a random verification code
    verification_code = str(random.randint(100000, 999999))

    # Generate the token using a fixed salt
    token = s.dumps({'phone_number': f'{phone_number}@{carrier}', 'timestamp': datetime.now().isoformat(), 'verification_code': verification_code, 'choices': choices})

    # Send the verification code via email to SMS
    sender_email = os.getenv('SENDER_EMAIL')
    sender_password = os.getenv('SENDER_PASSWORD')
    sms_email = f'{re.sub("[^0-9]", "", phone_number)}@{carrier}'
    for i in db.keys():
        print(i, db[i])
    send_email(f'Your eClubber verification code is: {verification_code}', sender_email, sms_email, sender_password)
    
    return jsonify({'message': 'Verification code sent', 'token': token})

@app.route('/api/verify_code', methods=['POST'])
def verify_code():
    # The client should send the verification code and the signed token
    print("entered flask verify")

    verification_code = request.form['verification_code']
    token = request.form['token']
    schoolID = request.form['schoolID']
    # Verify the token using the same fixed salt
    try:
        data = s.loads(token, max_age=600, salt='phone-verification')
        phone_number = data['phone_number']
        choices = data['choices']
    except Exception as e:
        print("error token", str(e), e)
        return jsonify({'message': f"Invalid verification code, can't load token. Error: {str(e)}"})

    # Check that the phone number is correct and the timestamp is recent
    if datetime.now() - datetime.fromisoformat(data['timestamp']) > timedelta(minutes=10):
        print("error too late")
        return jsonify({'message': 'Invalid verification code'})

    # Check that the verification code matches the one in ====================-token
    if verification_code != data['verification_code']:
        print("error")
        return jsonify({'message': 'Invalid verification code'})
      # replace with the actual student ID
    if str(phone_number) in db.values():
        
        return jsonify({'message': 'This phone number is already in use'})
        print("error already used")
    else:
        db[schoolID] = ", ".join([str(phone_number), str(fsession["rname"]), str(", ".join(choices))])

    # If we've gotten this far, the verification code is correct
    return jsonify({'message': 'Verification code confirmed'})

#------------------------------------------------------------------------
#------------------------------------------------------------------------
#------------------------------------------------------------------------
#------------------------------------------------------------------------
#------------------------------------------------------------------------
#    GRADE PARSER 
#------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("login.html")
  
@app.route('/api/get_grades', methods=['POST'])
def get_grades():

    print('get grades initiated via api')
    data = request.get_json()
    schoolId = data.get('schoolId')
    password = data.get('password')

    login_url = "https://md-mcps-psv.edupoint.com/PXP2_Login_Student.aspx?regenerateSessionId=True"
    grades_url = 'https://md-mcps-psv.edupoint.com/PXP2_Gradebook.aspx?'

    session = requests.Session()
    response = session.get(login_url)

    soup = BeautifulSoup(response.text, 'html.parser')

    viewstate = soup.select_one('#__VIEWSTATE')['value']
    viewstategen = soup.select_one('#__VIEWSTATEGENERATOR')['value']
    eventvalidation = soup.select_one('#__EVENTVALIDATION')['value']

    login_data = {
        '__VIEWSTATE': viewstate,
        '__VIEWSTATEGENERATOR': viewstategen,
        '__EVENTVALIDATION': eventvalidation,
        'ctl00$MainContent$username': schoolId,
        'ctl00$MainContent$password': password,
        'ctl00$MainContent$Submit1': 'Login'
    }
    
    response = session.post(login_url, data=login_data)

    grades_data = []

    if 'or password' not in response.text.lower():
        response = session.get(grades_url)
        soup = BeautifulSoup(response.text, 'html.parser')
        class_rows = soup.find_all("div", class_="row gb-class-header gb-class-row flexbox horizontal")
      
        school_div = soup.find('div', {'class': 'school'})
        school = school_div.text.strip()
        greeting_span = soup.find('span', id='Greeting')
        if greeting_span:
            name = re.search(r'Good \w+, (.+), \d+/\d+/\d+', greeting_span.text).group(1)
            fsession['rname'] = str(name)
        else:
            name = 'Unknown'
        for class_row in class_rows:
            class_title = class_row.find("button", class_="btn btn-link course-title").text.strip()
            teacher = class_row.find("div", class_="teacher hide-for-screen").text.strip()
            room_number = class_row.find("div", class_="teacher-room hide-for-print").text.strip()
            
            grade_row = class_row.find_next_sibling("div", class_="row gb-class-row")
            letter_grade = grade_row.find("span", class_="mark").text.strip()
            try:
              if int(letter_grade):
                print(f"validated {letter_grade}")
                letter_grade = int(letter_grade)
                if 89.5 <= letter_grade <= 100:
                  letter_grade = "A"
                elif 79.5 <= letter_grade <= 89.49:
                  letter_grade = "B"
                elif 69.5 <= letter_grade <= 79.49:
                  letter_grade = "C"
                elif 59.5 <= letter_grade <= 69.49:
                  letter_grade = "D"
                elif 0 <= letter_grade <= 59.49:
                  letter_grade = "E"
            except Exception as e:
              print(e)
              if letter_grade != "N/A":
                print("error check in app.py code")
            percentage_grade = grade_row.find("span", class_="score").text.strip()
            missing_assignments = grade_row.find("div", class_="class-item-lessemphasis hide-for-print").find("div").text.strip()
            print(f'|{school}|') #returns 'Montgomery Blair High'
            class_data = {
                "class_title": class_title,
                "teacher": teacher,
                "room_number": room_number,
                "letter_grade": letter_grade,
                "percentage_grade": percentage_grade,
                "missing_assignments": missing_assignments,
                'school': school
            }
            school_data = {
                "name": name,
                "school": school,
                "grades": grades_data
            }
            grades_data.append(class_data)
    else:
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify(school_data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


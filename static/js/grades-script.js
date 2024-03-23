document.addEventListener('DOMContentLoaded', async function () {
  let schoolData = JSON.parse(localStorage.getItem("gradesData"));
  let gradesData = schoolData.grades;
  let school = schoolData.school;
  let name = schoolData.name;
  //establish name greeting
  let m = 9, s = 60;
  const updateTimer = () => {
    s--; 
    if (!s) { 
      s = m ? 59 : 60; 
      m = m ? m - 1 : 9; 
    }
    document.getElementById('timerHeader').innerText = `Sign up in ${m}:${s < 10 ? '0' : ''}${s} for a free lifetime subscription!`;
  };
  setInterval(updateTimer, 1000);

  fetch('/set_spots')
    .then(response => response.text())
    .then(data => {
      // Store the number of spots left in session storage
      sessionStorage.setItem('spots_left', data);
      // Update the HTML to display the number of spots left
      const spotsElement = document.getElementById('spots-left');
     
      spotsElement.textContent = `4/20 spots left`;
      
    });  
    
  let greeting = document.createElement('h2');
  greeting.classList.add('greeting');
  let date = new Date();
  let hour = date.getHours();
  if (hour < 12) {
    greeting.textContent = `Good morning, ${name}!`;
  } else if (hour < 18) {
    greeting.textContent = `Good afternoon, ${name}!`;
  } else {
    greeting.textContent = `Good evening, ${name}!`;
  }
  document.body.prepend(greeting);
  
  const gradesContainer = document.getElementById('grades-container');
  const loadingSymbol = document.getElementById("loading-container");

  // fetch grades data
  async function fetchGradesData(schoolId, password) {
    const response = await fetch("/api/get_grades", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        schoolId: schoolId,
        password: password,
      }),
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      return null;
    }
  }

  if (!Array.isArray(gradesData)) {
    gradesData = [];
  }
  try {
    for (let gradeData of gradesData) {
      const gradeCard = document.createElement('div');
      gradeCard.classList.add('grade-card');
  
      const leftContent = document.createElement('div');
      leftContent.classList.add('left-content');
      gradeCard.appendChild(leftContent);
  
      const classTitle = document.createElement('h2');
      classTitle.classList.add('class-title');
      classTitle.textContent = gradeData.class_title;
      leftContent.appendChild(classTitle);
  
      const teacher = document.createElement('p');
      teacher.classList.add('teacher');
      teacher.textContent = `${gradeData.teacher}`;
      leftContent.appendChild(teacher);
  
      const rightContent = document.createElement('div');
      rightContent.classList.add('right-content');
      gradeCard.appendChild(rightContent);
  
      const letterGrade = document.createElement('span');
      letterGrade.classList.add('letter-grade');
      letterGrade.textContent = gradeData.letter_grade;
      rightContent.appendChild(letterGrade);
  
      switch (gradeData.letter_grade) {
        case 'A':
          letterGrade.classList.add('grade-a');
          letterGrade.classList.add('grade-a')
  
          break;
        case 'B':
          letterGrade.classList.add('grade-b');
          break;
        case 'C':
          letterGrade.classList.add('grade-c');
          break;
        case 'D':
          letterGrade.classList.add('grade-d');
          break;
        case 'F':
          letterGrade.classList.add('grade-f');
          break;
      }
  
      const percentageGrade = document.createElement('p');
      percentageGrade.classList.add('percentage-grade');
      percentageGrade.textContent = `${gradeData.percentage_grade}`;
      rightContent.appendChild(percentageGrade);
  
      const missingAssignments = document.createElement('p');
      missingAssignments.classList.add('missing-assignments');
      missingAssignments.textContent = `${gradeData.room_number} | ${gradeData.missing_assignments}`;
      leftContent.appendChild(missingAssignments);
            // Check if we have one or two columns of grade cards
      if (window.innerWidth >= 700) {
        // Two columns
        if (Array.from(gradesContainer.children).length % 2 === 0) {
          gradeCard.classList.add('slide-from-left');
        } else {
          gradeCard.classList.add('slide-from-right');
        }
      } else {
        // One column, all slide in from the right
        gradeCard.classList.add('slide-from-right');
      }
      gradesContainer.appendChild(gradeCard);


      
    }
  } catch (error) {
    console.log('passing error ', error)
  }
  
  
  let mySection = document.getElementById('notice-container');
  
  if (school !== 'Montgomery Blair High') {
    mySection.style.display = 'flex';
  }
});

function logout() {
  localStorage.removeItem('savedSchoolId');
  localStorage.removeItem('savedPassword');
  localStorage.removeItem('gradesData');
  window.location.href = '/';
}

function togrades() {
  window.location.href = 'grades.html';
}

function checkID() {
  const schoolID = localStorage.getItem("teleasUsername");
  fetch('/api/checkID?id=' + schoolID)
    .then(response => response.json())
    .then(data => {
      const show = data;
      if (show) {
        window.location.href = 'alreadyon.html';
      } else {
        window.location.href = 'clubber.html';
      }
    });
}



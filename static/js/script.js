document.addEventListener("DOMContentLoaded", function () {
  // Load saved credentials if they exist
  const savedSchoolId = localStorage.getItem("savedSchoolId");
  const savedPassword = localStorage.getItem("savedPassword");
  const gradesForm = document.getElementById("grades-form");
  const formSubmitted = sessionStorage.getItem('formSubmitted')
  
  if (savedSchoolId && savedPassword && !formSubmitted) {
    document.getElementById("school-id").value = savedSchoolId;
    document.getElementById("password").value = savedPassword;
    document.getElementById("remember_me").checked = true;
    sessionStorage.setItem('formSubmitted', 'true');
    
    // Use setTimeout to delay form submission
    setTimeout(function() {
      gradesForm.dispatchEvent(new Event("submit"));
      console.log('autologin')
    }, 100); // Delay of 100ms
  }
  
  gradesForm.addEventListener("submit", async (event) => {
    console.log('form submitted                                                  ')
    event.preventDefault();
    const schoolId = document.getElementById("school-id").value;
    const password = document.getElementById("password").value;
    
    // Save credentials if "Remember me" is checked.
    //if (document.getElementById("remember_me").checked) {
    //  localStorage.setItem("savedSchoolId", schoolId);
    //  localStorage.setItem("savedPassword", password);
    //} else {
    //  localStorage.removeItem("savedSchoolId");
    //  localStorage.removeItem("savedPassword");
    //}
    localStorage.setItem('teleasUsername', schoolId)
    const loadingSymbol = document.getElementById("loading-container");
    loadingSymbol.style.display = "flex";
    
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
    sessionStorage.removeItem('formSubmitted')
    loadingSymbol.style.display = "none";
    
    if (response.status === 200) {
      const gradesData = await response.json();
      localStorage.setItem("gradesData", JSON.stringify(gradesData));
      // Set cookies for schoolId and password
      document.cookie = `schoolId=${schoolId}; max-age=36400`; // Expires in 1/3 day
      document.cookie = `password=${password}; max-age=36400`; 
      sessionStorage.setItem('afterlogin', true);
      window.location.href = "static/grades.html";
    } else {
      alert("Invalid credentials");
    }
  });
});
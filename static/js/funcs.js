
function logout() {
  localStorage.removeItem('savedSchoolId');
  localStorage.removeItem('savedPassword');
  localStorage.removeItem('gradesData');
  window.location.href = '/';
}

function togrades() {
  window.location.href = 'grades.html';
}


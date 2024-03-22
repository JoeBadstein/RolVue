document.addEventListener("DOMContentLoaded", () => {
  // Function to simulate typing effect
  let selectedCarrier = null;
  let selectedPhoneNumber = null;
  const typeText = async (element, text, delay) => {
    const cursor = document.querySelector('.cursor');
    for (const char of text) {
      cursor.style.animation = 'blink 1s infinite';
      element.innerHTML += char === "\n" ? "<br>" : char;
      await new Promise((resolve) => setTimeout(resolve, delay));
      cursor.style.animation = 'blink 1s infinite'; // Resume blinking after typing
    }
  };

  
  const simulateEnterKeyPress = (element) => {
    const event = new KeyboardEvent("keydown", {
      bubbles : true,
      cancelable : true,
      key : "Enter"
    });
    element.dispatchEvent(event);
  };
  
  // Event listeners for Submit buttons
  document.querySelectorAll('.submit-button').forEach(button => {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      const container = event.target.closest('.input-container');
      let inputElement;
      if (container.id === 'phone-container') {
        inputElement = document.getElementById('phone-number');
      } else if (container.id === 'carrier-container') {
        inputElement = document.getElementById('carrier');
      } else if (container.id === 'verification-container') {
        inputElement = document.getElementById('verification-code');
      }
      if (inputElement) {
        simulateEnterKeyPress(inputElement);
      }
    });
  });




  
  // Elements
  const animationContainer = document.getElementById("animation-container");
  const animatedText = document.getElementById("animated-text");
  const phoneContainer = document.getElementById("phone-container");
  const carrierContainer = document.getElementById("carrier-container");
  const preferenceContainer = document.getElementById("preference-container");
  const verificationContainer = document.getElementById("verification-container");
  const backArrow = document.getElementById("back-arrow");
  const centerContainer = (container) => {
    container.style.position = 'absolute';
    container.style.top = '50%';
    container.style.transform = 'translateY(-50%)';
  };
  
  // Apply centering to each container
  centerContainer(phoneContainer);
  centerContainer(carrierContainer);
  centerContainer(preferenceContainer);
  centerContainer(verificationContainer);
  // Initial typing animation
  // Function to show or hide text blinker
  const toggleBlinker = (show) => {
    const cursor = document.querySelector('.cursor');
    cursor.style.visibility = show ? 'visible' : 'hidden';
  };
  
  // Function for zoom out to left animation
  const zoomOutLeft = (element) => {
    element.classList.add('zoom-out-left');
    setTimeout(() => {
      element.classList.remove('zoom-out-left');
      element.style.opacity = 0;
    }, 500);
  };
  
  // Initial typing animation
  const startAnimation = async () => {
    toggleBlinker(true);  // Show the blinker
    await typeText(animatedText, "Join the waitlist to be a part of the new initiative.", 20);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await typeText(animatedText, "\nThat brings people together over the one sacred need...", 30);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await typeText(animatedText, "\nㅤFood.", 150);
    toggleBlinker(false);  // Hide the blinker
    await new Promise((resolve) => setTimeout(resolve, 3000));
  
    zoomOutLeft(animationContainer);  // Zoom out animation for the text animation container
    phoneContainer.classList.remove("hidden");
    phoneContainer.style.opacity = 1;
    backArrow.classList.remove("hidden");
    backArrow.style.opacity = 1;
  };

  startAnimation();

  // Event listener for phone number submission
// Update selectedPhoneNumber when phone number is entered
  document.getElementById("phone-number").addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      phoneContainer.style.opacity = 0; 
      selectedPhoneNumber = event.target.value;
      carrierContainer.classList.remove("hidden");
      carrierContainer.style.opacity = 1;   
    }
  });
  
  // Update selectedCarrier when carrier is selected
  document.getElementById("carrier").addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      selectedCarrier = event.target.value;
      // Move to next step or form
    }
  });

  // Event listener for preferences submission
  document.getElementById("preference-submit").addEventListener("click", async () => {
    preferenceContainer.style.opacity = 0;
    verificationContainer.classList.remove("hidden");
    verificationContainer.style.opacity = 1;
  });
  // Within the carrier event listener
  document.getElementById("carrier").addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      selectedCarrier = event.target.value;
  
      if (selectedPhoneNumber && selectedCarrier) {
        const response = await fetch("/api/validate_phone", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `phone_number=${selectedPhoneNumber}&carrier=${selectedCarrier}`,
        });
  
        const data = await response.json();
        if (data.message === "Verification code sent") {
          window.token = data.token;  // Set the token
          carrierContainer.style.opacity = 0;
          preferenceContainer.classList.remove("hidden");
          preferenceContainer.style.opacity = 1;
        }
      }
    }
  });
  
  // Event listener for verification code
  document.getElementById("verification-code").addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const verificationCode = event.target.value;
      const phoneNumber = document.getElementById("phone-number").value;
      const carrier = document.getElementById("carrier").value;
      const schoolID = localStorage.getItem("teleasUsername");
      // API call to Flask backend
      const response = await fetch("/api/verify_code", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `verification_code=${verificationCode}&token=${window.token}&schoolID=${schoolID}`,
      });
      const data = await response.json();
      if (data.message === "Verification code confirmed") {
        verificationContainer.innerHTML = "<h1>You're on the waitlist!</h1>";
      } else {
        const errorLabel = document.getElementById("verification-error");
        errorLabel.classList.remove("hidden");
        errorLabel.innerHTML = "Invalid code or number already in use.";
      }
    }
  });
  
  // Back arrow functionality
  backArrow.addEventListener("click", () => {
    window.history.back();
  });
});

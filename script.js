document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("contact-form");

  form.addEventListener("submit", function(event) {
    event.preventDefault(); // Förhindra att formuläret skickas på traditionellt sätt

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    // Enkel validering
    if (name && email && message) {
      // Här kan du skicka formuläret till en server med fetch eller XMLHttpRequest
      // För demonstration kommer vi att använda en alert
      alert(`Tack för ditt meddelande, ${name}! Vi kommer att återkomma till dig på ${email}.`);
      
      form.reset(); // Rensa formuläret
    } else {
      alert("Vänligen fyll i alla fält.");
    }
  });
});

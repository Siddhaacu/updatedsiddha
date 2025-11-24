async function includeHTML(){
  const elements = document.querySelectorAll("[include-html]");
  for (let el of elements) {
    const file = el.getAttribute("include-html");
    try {
      const response = await fetch(file);
      if (response.ok) {
        el.innerHTML = await response.text();
      } else {
        el.innerHTML = "<!-- File not found: " + file + " -->";
      }
    } catch(err) {
      el.innerHTML = "<!-- Error loading " + file + " -->";
    }
  }
}
document.addEventListener("DOMContentLoaded", includeHTML);

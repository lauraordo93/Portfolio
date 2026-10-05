// El año del copyright del footer se pone solo, para no tener que tocarlo cada enero.
// En el HTML va escrito el año como está al publicar: si no hay JS, se ve ese.
document.addEventListener('DOMContentLoaded', () => {
  const anio = String(new Date().getFullYear());
  document.querySelectorAll('[data-anio]').forEach((el) => {
    el.textContent = anio;
  });
});

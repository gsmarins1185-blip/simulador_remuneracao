/* ===================================================================
   login.js — verificação de acesso da Calculadora de Salário da PM

   ATENÇÃO (segurança): esta verificação é só no navegador, portanto NÃO
   é segura. As credenciais abaixo ficam visíveis para quem abrir este
   arquivo, e o login pode ser pulado acessando a calculadora direto.
   Para proteção real, a checagem precisa ser feita em um servidor
   (ex.: PHP + banco de dados), entregando a página só após autenticar.
   =================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  const USUARIO = 'pmerj';
  const SENHA   = 'dcp1010';

  const inUser = document.getElementById('usuario');
  const inSenha = document.getElementById('senha');
  const btn = document.getElementById('btn-entrar');
  const erro = document.getElementById('login-erro');

  if (!inUser || !inSenha || !btn) {
    console.error('Login: elemento não encontrado. Confira os id usuario, senha, btn-entrar.');
    return;
  }

  function entrar() {
    const ok = inUser.value.trim() === USUARIO && inSenha.value === SENHA;
    if (ok) {
      window.location.href = 'calculadora_pmerj.html'; // vai para a calculadora
    } else if (erro) {
      erro.style.display = 'block';
    }
  }

  btn.addEventListener('click', entrar);

  // permite confirmar com a tecla Enter em qualquer um dos campos
  [inUser, inSenha].forEach(function (el) {
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') entrar();
    });
  });
});

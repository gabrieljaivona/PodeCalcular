'use strict';

const ferramentas = [
  {
    nome: 'Calculadora de Rescisão',
    url: 'rescisao.html',
    emoji: '💼',
    categoria: 'Trabalhador',
    keywords: 'rescisão demissão trabalhista clt fgts aviso prévio saldo salário verba indenização desligamento'
  },
  {
    nome: 'Calculadora de Férias CLT',
    url: 'ferias.html',
    emoji: '🏖️',
    categoria: 'Trabalhador',
    keywords: 'férias clt trabalhador terço constitucional abono pecuniário venda dias descanso proporcionais'
  },
  {
    nome: 'Calculadora de Décimo Terceiro',
    url: 'decimo-terceiro.html',
    emoji: '🎁',
    categoria: 'Trabalhador',
    keywords: 'décimo terceiro 13 salário natal gratificação proporcional meses trabalhados clt parcela'
  },
  {
    nome: 'Calculadora de Hora Extra',
    url: 'hora-extra.html',
    emoji: '⏰',
    categoria: 'Trabalhador',
    keywords: 'hora extra adicional noturno cinquenta cem porcento clt horas trabalhadas jornada noturna'
  },
  {
    nome: 'Simulador de Maquininha de Cartão',
    url: 'maquininha.html',
    emoji: '💳',
    categoria: 'Empreendedor',
    keywords: 'maquininha cartão taxa débito crédito parcelado líquido receber repassar operadora venda'
  },
  {
    nome: 'Calculadora de Valor da Hora',
    url: 'valor-hora.html',
    emoji: '⏱️',
    categoria: 'Empreendedor',
    keywords: 'valor hora freelancer autônomo precificação cobrar quanto mei pj trabalho serviço'
  },
  {
    nome: 'Calculadora de Margem de Lucro',
    url: 'margem-lucro.html',
    emoji: '📈',
    categoria: 'Empreendedor',
    keywords: 'margem lucro markup produto preço venda custo lucratividade rentabilidade negócio'
  },
  {
    nome: 'Calculadora de Preço de Venda',
    url: 'preco-venda.html',
    emoji: '🏷️',
    categoria: 'Empreendedor',
    keywords: 'preço venda formação precificação markup impostos custos produto loja quanto cobrar'
  },
  {
    nome: 'Calculadora de IMC',
    url: 'imc.html',
    emoji: '⚖️',
    categoria: 'Saúde',
    keywords: 'imc índice massa corporal peso altura obesidade oms saúde ideal sobrepeso'
  },
  {
    nome: 'Calculadora de TMB e Gasto Calórico',
    url: 'tmb.html',
    emoji: '🔥',
    categoria: 'Saúde',
    keywords: 'tmb taxa metabólica basal gasto calórico calorias metabolismo emagrecer dieta nutrição mifflin'
  },
  {
    nome: 'Calculadora de Água Diária',
    url: 'agua.html',
    emoji: '💧',
    categoria: 'Saúde',
    keywords: 'água hidratação litros diário beber dia peso atividade física copos desidratação'
  }
];

(function () {
  const form = document.getElementById('searchForm');
  const input = document.getElementById('searchInput');
  if (!form || !input) return;

  const dropdown = document.createElement('ul');
  dropdown.className = 'search-dropdown';
  dropdown.setAttribute('role', 'listbox');
  dropdown.setAttribute('aria-label', 'Calculadoras sugeridas');
  form.appendChild(dropdown);

  let focusedIndex = -1;

  function normalizar(str) {
    return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function filtrar(query) {
    const termos = normalizar(query.trim()).split(/\s+/).filter(Boolean);
    if (!termos.length) return [];
    return ferramentas.filter(function (f) {
      const texto = normalizar(f.nome + ' ' + f.keywords + ' ' + f.categoria);
      return termos.every(function (t) { return texto.includes(t); });
    });
  }

  function getItems() {
    return Array.from(dropdown.querySelectorAll('.search-dropdown__item'));
  }

  function atualizarFoco(items) {
    items.forEach(function (item, i) {
      const ativo = i === focusedIndex;
      item.classList.toggle('is-focused', ativo);
      item.setAttribute('aria-selected', ativo ? 'true' : 'false');
    });
    if (focusedIndex >= 0 && items[focusedIndex]) {
      items[focusedIndex].focus();
    }
  }

  function fecharDropdown() {
    dropdown.classList.remove('is-visible');
    dropdown.innerHTML = '';
    focusedIndex = -1;
  }

  function renderizar(resultados) {
    dropdown.innerHTML = '';
    focusedIndex = -1;

    if (!resultados.length) {
      const li = document.createElement('li');
      li.className = 'search-dropdown__empty';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.textContent = 'Nenhuma calculadora encontrada.';
      dropdown.appendChild(li);
      dropdown.classList.add('is-visible');
      return;
    }

    resultados.forEach(function (f) {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');

      const a = document.createElement('a');
      a.href = f.url;
      a.className = 'search-dropdown__item';
      a.tabIndex = -1;

      const spanEmoji = document.createElement('span');
      spanEmoji.className = 'search-dropdown__emoji';
      spanEmoji.setAttribute('aria-hidden', 'true');
      spanEmoji.textContent = f.emoji;

      const spanNome = document.createElement('span');
      spanNome.className = 'search-dropdown__name';
      spanNome.textContent = f.nome;

      const spanCat = document.createElement('span');
      spanCat.className = 'search-dropdown__category';
      spanCat.textContent = f.categoria;

      a.appendChild(spanEmoji);
      a.appendChild(spanNome);
      a.appendChild(spanCat);
      li.appendChild(a);
      dropdown.appendChild(li);
    });

    dropdown.classList.add('is-visible');
  }

  input.addEventListener('input', function () {
    if (!input.value.trim()) {
      fecharDropdown();
      return;
    }
    renderizar(filtrar(input.value));
  });

  form.addEventListener('keydown', function (e) {
    if (!dropdown.classList.contains('is-visible')) return;
    const items = getItems();

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
      atualizarFoco(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusedIndex--;
      if (focusedIndex < 0) {
        focusedIndex = -1;
        input.focus();
      } else {
        atualizarFoco(items);
      }
    } else if (e.key === 'Escape') {
      fecharDropdown();
      input.focus();
    } else if (e.key === 'Tab') {
      fecharDropdown();
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const items = getItems();
    if (focusedIndex >= 0 && items[focusedIndex]) {
      window.location.href = items[focusedIndex].getAttribute('href');
      return;
    }
    const resultados = filtrar(input.value);
    if (resultados.length) {
      window.location.href = resultados[0].url;
    }
  });

  document.addEventListener('click', function (e) {
    if (!form.contains(e.target)) {
      fecharDropdown();
    }
  });

  form.addEventListener('focusout', function (e) {
    if (!form.contains(e.relatedTarget)) {
      setTimeout(fecharDropdown, 150);
    }
  });
}());

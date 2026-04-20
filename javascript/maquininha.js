/**
         * PodeCalcular - Simulador de Taxas de Maquininha
         * -------------------------------------------------
         * Dois modos de cálculo:
         *
         * 1) ASSUMIR A TAXA (descobrir o valor líquido):
         *    Desconto    = valorVenda × (taxa / 100)
         *    Líquido     = valorVenda − desconto
         *
         * 2) REPASSAR A TAXA (descobrir quanto cobrar):
         *    Cobrar      = valorDesejado / (1 − taxa / 100)
         *    Desconto    = cobrar × (taxa / 100)
         *    Conferência = cobrar − desconto === valorDesejado
         */

        (function() {
            'use strict';

            // =========== REFERÊNCIAS DOM ===========
            var form = document.getElementById('formMaquininha');
            var resultadoEl = document.getElementById('resultado');
            var flowContainer = document.getElementById('flowContainer');
            var resultTitle = document.getElementById('resultTitle');
            var resultKicker = document.getElementById('resultKicker');
            var labelValor = document.getElementById('labelValor');

            // =========== ATUALIZAR LABEL DO CAMPO DE VALOR ===========
            // Muda o label dinamicamente conforme a opção selecionada
            var radios = document.querySelectorAll('input[name="modo"]');
            radios.forEach(function(radio) {
                radio.addEventListener('change', function() {
                    if (this.value === 'assumir') {
                        labelValor.textContent = 'Valor da venda';
                    } else {
                        labelValor.textContent = 'Valor que deseja receber';
                    }
                });
            });

            // =========== HELPERS ===========

            function formatBRL(valor) {
                return valor.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }

            function criarFlowStep(cls, label, sublabel, valor) {
                var div = document.createElement('div');
                div.className = 'flow-step ' + cls;
                div.innerHTML =
                    '<div class="flow-step__label">' +
                        '<strong>' + label + '</strong>' +
                        (sublabel ? '<small>' + sublabel + '</small>' : '') +
                    '</div>' +
                    '<div class="flow-step__value">' + valor + '</div>';
                return div;
            }

            function criarArrow() {
                var div = document.createElement('div');
                div.className = 'flow-arrow';
                div.setAttribute('aria-hidden', 'true');
                div.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>';
                return div;
            }

            // =========== VALIDAÇÃO ===========

            function limparErros() {
                document.querySelectorAll('.form-field').forEach(function(f) {
                    f.classList.remove('has-error');
                });
            }

            function marcarErro(id) {
                var el = document.getElementById(id);
                if (el) el.classList.add('has-error');
            }

            function validar(valor, taxa) {
                var ok = true;
                if (!valor || valor <= 0 || isNaN(valor)) {
                    marcarErro('field-valor');
                    ok = false;
                }
                if (!taxa || taxa <= 0 || taxa >= 100 || isNaN(taxa)) {
                    marcarErro('field-taxa');
                    ok = false;
                }
                return ok;
            }

            // =========== RENDERIZAÇÃO ===========

            function renderAssumirTaxa(valor, taxa) {
                var desconto = valor * (taxa / 100);
                var liquido = valor - desconto;

                resultKicker.textContent = '📉 Você assume a taxa';
                resultTitle.textContent = 'Quanto vai cair na sua conta';

                flowContainer.innerHTML = '';
                flowContainer.appendChild(criarFlowStep(
                    'flow-step--input',
                    'Valor da venda',
                    'O que o cliente paga',
                    formatBRL(valor)
                ));
                flowContainer.appendChild(criarArrow());
                flowContainer.appendChild(criarFlowStep(
                    'flow-step--loss',
                    'Desconto da operadora',
                    taxa.toFixed(2).replace('.', ',') + '% de taxa',
                    '− ' + formatBRL(desconto)
                ));
                flowContainer.appendChild(criarArrow());
                flowContainer.appendChild(criarFlowStep(
                    'flow-step--result',
                    'Valor líquido',
                    'O que você recebe de verdade',
                    formatBRL(liquido)
                ));
            }

            function renderRepassarTaxa(valorDesejado, taxa) {
                var cobrar = valorDesejado / (1 - taxa / 100);
                var desconto = cobrar * (taxa / 100);

                resultKicker.textContent = '📈 Você repassa a taxa';
                resultTitle.textContent = 'Quanto cobrar do cliente';

                flowContainer.innerHTML = '';
                flowContainer.appendChild(criarFlowStep(
                    'flow-step--input',
                    'Valor que quer receber',
                    'Seu preço real',
                    formatBRL(valorDesejado)
                ));
                flowContainer.appendChild(criarArrow());
                flowContainer.appendChild(criarFlowStep(
                    'flow-step--result',
                    'Cobrar do cliente',
                    'Preço com taxa embutida',
                    formatBRL(cobrar)
                ));
                flowContainer.appendChild(criarArrow());
                flowContainer.appendChild(criarFlowStep(
                    'flow-step--loss',
                    'Desconto da operadora',
                    taxa.toFixed(2).replace('.', ',') + '% de ' + formatBRL(cobrar),
                    '− ' + formatBRL(desconto)
                ));
                flowContainer.appendChild(criarArrow());
                flowContainer.appendChild(criarFlowStep(
                    'flow-step--input',
                    'Você recebe',
                    'Conferência: exatamente o que desejou',
                    formatBRL(valorDesejado)
                ));
            }

            // =========== SUBMIT HANDLER ===========

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                limparErros();

                var valor = parseFloat(document.getElementById('valor').value);
                var taxa = parseFloat(document.getElementById('taxa').value);
                var modo = document.querySelector('input[name="modo"]:checked').value;

                if (!validar(valor, taxa)) return;

                if (modo === 'assumir') {
                    renderAssumirTaxa(valor, taxa);
                } else {
                    renderRepassarTaxa(valor, taxa);
                }

                resultadoEl.classList.add('is-visible');

                setTimeout(function() {
                    resultadoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
            });

            // Limpa erros ao interagir
            form.addEventListener('input', function(e) {
                var field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
/**
         * PodeCalcular - Calculadora de Férias CLT
         * ------------------------------------------
         * Regras aplicadas (valores BRUTOS, sem descontos):
         *   - Valor das férias:     (salário / 30) × dias tirados
         *   - 1/3 constitucional:   valor das férias / 3
         *   - Abono pecuniário:     (salário / 30) × 10  [se o usuário escolher vender]
         *   - 1/3 sobre o abono:    abono / 3
         *   - Total bruto:          soma de todos os valores acima
         *
         * Não aplicamos descontos de INSS nem de IRRF (conforme briefing).
         * O abono pecuniário é isento desses tributos na prática, mas o valor
         * das férias em si sofre tributação — o usuário é avisado no disclaimer.
         */

        (function() {
            'use strict';

            // =========== REFERÊNCIAS DOM ===========
            const form = document.getElementById('formFerias');
            const resultadoEl = document.getElementById('resultado');
            const resultadoLinhasEl = document.getElementById('resultadoLinhas');
            const resultadoTotalEl = document.getElementById('resultadoTotal');

            // =========== HELPERS ===========

            /**
             * Formata um número em moeda brasileira.
             */
            function formatBRL(valor) {
                return valor.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }

            // =========== REGRAS DE CÁLCULO ===========

            /**
             * Valor das férias: salário diário × dias tirados.
             */
            function calcValorFerias(salario, dias) {
                return (salario / 30) * dias;
            }

            /**
             * 1/3 constitucional: aplica-se sempre sobre o valor calculado.
             */
            function calcUmTerco(valor) {
                return valor / 3;
            }

            /**
             * Abono pecuniário: 10 dias convertidos em dinheiro (art. 143 CLT).
             * Retorna um objeto com o valor do abono e o 1/3 constitucional sobre ele.
             */
            function calcAbono(salario) {
                const valorAbono = (salario / 30) * 10;
                const umTercoAbono = valorAbono / 3;
                return {
                    valor: valorAbono,
                    umTerco: umTercoAbono,
                    total: valorAbono + umTercoAbono
                };
            }

            // =========== VALIDAÇÃO ===========

            function limparErros() {
                document.querySelectorAll('.form-field').forEach(f => f.classList.remove('has-error'));
            }

            function marcarErro(id) {
                const field = document.getElementById(id);
                if (field) field.classList.add('has-error');
            }

            function validar(salario, dias) {
                let ok = true;

                if (!salario || salario <= 0 || isNaN(salario)) {
                    marcarErro('field-salario');
                    ok = false;
                }
                if (!dias || dias < 1 || dias > 30 || isNaN(dias)) {
                    marcarErro('field-dias');
                    ok = false;
                }
                return ok;
            }

            // =========== RENDERIZAÇÃO ===========

            function criarLinha(label, desc, valor) {
                const div = document.createElement('div');
                div.className = 'result-line';
                div.innerHTML = `
                    <div class="result-line__label">
                        <strong>${label}</strong>
                        <small>${desc}</small>
                    </div>
                    <div class="result-line__value">${formatBRL(valor)}</div>
                `;
                return div;
            }

            function renderizarResultado(dados) {
                resultadoLinhasEl.innerHTML = '';

                // Linha 1 - Valor das férias
                resultadoLinhasEl.appendChild(criarLinha(
                    'Valor das férias',
                    `${dados.dias} dia(s) × (salário ÷ 30)`,
                    dados.valorFerias
                ));

                // Linha 2 - 1/3 constitucional sobre as férias
                resultadoLinhasEl.appendChild(criarLinha(
                    '1/3 Constitucional',
                    'Adicional sobre o valor das férias (Art. 7º, XVII da CF)',
                    dados.umTercoFerias
                ));

                // Linha 3 e 4 - Abono pecuniário (somente se escolhido)
                if (dados.vendeuAbono) {
                    resultadoLinhasEl.appendChild(criarLinha(
                        'Abono Pecuniário',
                        '10 dias vendidos (Art. 143 da CLT)',
                        dados.abonoValor
                    ));
                    resultadoLinhasEl.appendChild(criarLinha(
                        '1/3 sobre o Abono',
                        'Terço constitucional sobre os 10 dias vendidos',
                        dados.abonoUmTerco
                    ));
                }

                resultadoTotalEl.textContent = formatBRL(dados.total);
                resultadoEl.classList.add('is-visible');

                // Scroll suave até o resultado
                setTimeout(() => {
                    resultadoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
            }

            // =========== SUBMIT HANDLER ===========

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                limparErros();

                const salario = parseFloat(document.getElementById('salario').value);
                const dias = parseInt(document.getElementById('diasFerias').value, 10);
                const vendeuAbono = document.querySelector('input[name="abono"]:checked').value === 'sim';

                if (!validar(salario, dias)) {
                    return;
                }

                // --- Cálculos ---
                const valorFerias = calcValorFerias(salario, dias);
                const umTercoFerias = calcUmTerco(valorFerias);

                let abonoValor = 0;
                let abonoUmTerco = 0;
                let abonoTotal = 0;

                if (vendeuAbono) {
                    const abono = calcAbono(salario);
                    abonoValor = abono.valor;
                    abonoUmTerco = abono.umTerco;
                    abonoTotal = abono.total;
                }

                const total = valorFerias + umTercoFerias + abonoTotal;

                renderizarResultado({
                    dias,
                    valorFerias,
                    umTercoFerias,
                    vendeuAbono,
                    abonoValor,
                    abonoUmTerco,
                    total
                });
            });

            // Limpa o estado de erro conforme o usuário digita
            form.addEventListener('input', function(e) {
                const field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
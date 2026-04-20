/**
         * PodeCalcular - Calculadora de 13º Salário
         * -------------------------------------------
         * Regras aplicadas (valores BRUTOS, sem descontos):
         *   - 13º proporcional = (salário ÷ 12) × meses trabalhados
         *   - 1ª parcela       = 50% do valor bruto (sem descontos)
         *   - 2ª parcela       = 50% do valor bruto (na prática, INSS e IRRF incidem aqui)
         *
         * Não aplicamos descontos de INSS/IRRF (conforme briefing).
         * O usuário é avisado no disclaimer.
         */

        (function() {
            'use strict';

            // =========== REFERÊNCIAS DOM ===========
            const form = document.getElementById('formDecimo');
            const resultadoEl = document.getElementById('resultado');
            const resultadoLinhasEl = document.getElementById('resultadoLinhas');
            const resultadoTotalEl = document.getElementById('resultadoTotal');
            const val1parcela = document.getElementById('val1parcela');
            const val2parcela = document.getElementById('val2parcela');

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

            // =========== VALIDAÇÃO ===========

            function limparErros() {
                document.querySelectorAll('.form-field').forEach(f => f.classList.remove('has-error'));
            }

            function marcarErro(id) {
                const field = document.getElementById(id);
                if (field) field.classList.add('has-error');
            }

            function validar(salario, meses) {
                let ok = true;

                if (!salario || salario <= 0 || isNaN(salario)) {
                    marcarErro('field-salario');
                    ok = false;
                }
                if (!meses || meses < 1 || meses > 12 || isNaN(meses)) {
                    marcarErro('field-meses');
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

                // Linha: 13º proporcional bruto
                resultadoLinhasEl.appendChild(criarLinha(
                    '13º Salário Proporcional (Bruto)',
                    `(${formatBRL(dados.salario)} ÷ 12) × ${dados.meses} mês(es)`,
                    dados.valorBruto
                ));

                // Linha: valor diário para referência
                resultadoLinhasEl.appendChild(criarLinha(
                    'Valor por mês trabalhado',
                    'Referência: salário ÷ 12',
                    dados.valorPorMes
                ));

                // Atualiza os cards das parcelas
                val1parcela.textContent = formatBRL(dados.primeiraParcela);
                val2parcela.textContent = formatBRL(dados.segundaParcela);

                // Total
                resultadoTotalEl.textContent = formatBRL(dados.valorBruto);

                resultadoEl.classList.add('is-visible');

                setTimeout(() => {
                    resultadoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
            }

            // =========== SUBMIT HANDLER ===========

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                limparErros();

                const salario = parseFloat(document.getElementById('salario').value);
                const meses = parseInt(document.getElementById('meses').value, 10);

                if (!validar(salario, meses)) {
                    return;
                }

                // --- Cálculos ---
                const valorPorMes = salario / 12;
                const valorBruto = valorPorMes * meses;
                const primeiraParcela = valorBruto / 2;
                const segundaParcela = valorBruto / 2;

                renderizarResultado({
                    salario,
                    meses,
                    valorPorMes,
                    valorBruto,
                    primeiraParcela,
                    segundaParcela
                });
            });

            // Limpa o estado de erro ao interagir
            form.addEventListener('input', function(e) {
                const field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });
            form.addEventListener('change', function(e) {
                const field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
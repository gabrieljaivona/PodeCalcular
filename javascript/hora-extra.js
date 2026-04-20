/**
         * PodeCalcular - Calculadora de Hora Extra e Adicional Noturno
         * --------------------------------------------------------------
         * Regras aplicadas (valores BRUTOS, sem descontos):
         *
         *   Hora normal       = salário ÷ jornada mensal
         *   HE 50%            = hora normal × 1,50 × qtd horas
         *   HE 100%           = hora normal × 2,00 × qtd horas
         *   Adicional Noturno = hora normal × 0,20 × qtd horas noturnas
         *
         * Simplificações declaradas no disclaimer:
         *   - Não inclui DSR sobre horas extras
         *   - Não aplica a hora noturna reduzida (52min30s)
         *   - Não aplica descontos de INSS/IRRF
         */

        (function() {
            'use strict';

            // =========== REFERÊNCIAS DOM ===========
            const form = document.getElementById('formHoraExtra');
            const resultadoEl = document.getElementById('resultado');
            const resultadoLinhasEl = document.getElementById('resultadoLinhas');
            const resultadoTotalEl = document.getElementById('resultadoTotal');
            const valHoraNormal = document.getElementById('valHoraNormal');
            const horaFormula = document.getElementById('horaFormula');

            // =========== HELPERS ===========

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
                const el = document.getElementById(id);
                if (el) el.classList.add('has-error');
            }

            function validar(salario, jornada) {
                let ok = true;

                if (!salario || salario <= 0 || isNaN(salario)) {
                    marcarErro('field-salario');
                    ok = false;
                }
                if (!jornada || jornada <= 0 || isNaN(jornada)) {
                    marcarErro('field-jornada');
                    ok = false;
                }
                return ok;
            }

            // =========== RENDERIZAÇÃO ===========

            function criarLinha(label, desc, valor) {
                const div = document.createElement('div');
                div.className = 'result-line';
                const isZero = valor === 0;
                div.innerHTML = `
                    <div class="result-line__label">
                        <strong>${label}</strong>
                        <small>${desc}</small>
                    </div>
                    <div class="result-line__value ${isZero ? 'result-line__value--zero' : ''}">${formatBRL(valor)}</div>
                `;
                return div;
            }

            function renderizarResultado(dados) {
                resultadoLinhasEl.innerHTML = '';

                // Atualiza a caixa de hora normal
                valHoraNormal.textContent = formatBRL(dados.horaNormal);
                horaFormula.textContent = `${formatBRL(dados.salario)} ÷ ${dados.jornada}h`;

                // Horas extras 50%
                const descHE50 = dados.qtdHE50 > 0
                    ? `${dados.qtdHE50}h × ${formatBRL(dados.horaNormal)} × 1,50`
                    : 'Nenhuma hora informada';
                resultadoLinhasEl.appendChild(criarLinha(
                    'Horas Extras a 50%',
                    descHE50,
                    dados.totalHE50
                ));

                // Horas extras 100%
                const descHE100 = dados.qtdHE100 > 0
                    ? `${dados.qtdHE100}h × ${formatBRL(dados.horaNormal)} × 2,00`
                    : 'Nenhuma hora informada';
                resultadoLinhasEl.appendChild(criarLinha(
                    'Horas Extras a 100%',
                    descHE100,
                    dados.totalHE100
                ));

                // Adicional noturno
                const descNoturna = dados.qtdNoturna > 0
                    ? `${dados.qtdNoturna}h × ${formatBRL(dados.horaNormal)} × 20%`
                    : 'Nenhuma hora informada';
                resultadoLinhasEl.appendChild(criarLinha(
                    'Adicional Noturno (20%)',
                    descNoturna,
                    dados.totalNoturno
                ));

                // Total
                resultadoTotalEl.textContent = formatBRL(dados.total);

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
                const jornada = parseFloat(document.getElementById('jornada').value);
                const qtdHE50 = parseFloat(document.getElementById('he50').value) || 0;
                const qtdHE100 = parseFloat(document.getElementById('he100').value) || 0;
                const qtdNoturna = parseFloat(document.getElementById('noturna').value) || 0;

                if (!validar(salario, jornada)) {
                    return;
                }

                // --- Cálculos CLT ---
                const horaNormal = salario / jornada;

                // HE 50%: hora normal × 1.50
                const valorHE50 = horaNormal * 1.50;
                const totalHE50 = valorHE50 * qtdHE50;

                // HE 100%: hora normal × 2.00
                const valorHE100 = horaNormal * 2.00;
                const totalHE100 = valorHE100 * qtdHE100;

                // Adicional noturno: 20% da hora normal
                const adicionalNoturno = horaNormal * 0.20;
                const totalNoturno = adicionalNoturno * qtdNoturna;

                const total = totalHE50 + totalHE100 + totalNoturno;

                renderizarResultado({
                    salario,
                    jornada,
                    horaNormal,
                    qtdHE50,
                    qtdHE100,
                    qtdNoturna,
                    totalHE50,
                    totalHE100,
                    totalNoturno,
                    total
                });
            });

            // Limpa estado de erro ao digitar
            form.addEventListener('input', function(e) {
                const field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
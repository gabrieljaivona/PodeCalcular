/**
         * PodeCalcular - Calculadora de Valor da Hora (Freelancer)
         * ----------------------------------------------------------
         * Fórmula:
         *   Faturamento bruto = ganhoDesejado + custosFixos
         *   Horas mensais     = diasPorSemana × horasPorDia × 4
         *   Valor da hora     = faturamentoBruto / horasMensais
         *   Valor com margem  = valorHora × 1.25 (margem de 25%)
         */

        (function() {
            'use strict';

            // =========== REFERÊNCIAS DOM ===========
            var form = document.getElementById('formValorHora');
            var resultadoEl = document.getElementById('resultado');

            var valHora = document.getElementById('valHora');
            var rateSub = document.getElementById('rateSub');
            var valBruto = document.getElementById('valBruto');
            var valHorasMes = document.getElementById('valHorasMes');
            var valCustoPct = document.getElementById('valCustoPct');

            var barIncome = document.getElementById('barIncome');
            var barCosts = document.getElementById('barCosts');
            var legendIncome = document.getElementById('legendIncome');
            var legendCosts = document.getElementById('legendCosts');

            var valComMargem = document.getElementById('valComMargem');

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
                document.querySelectorAll('.form-field').forEach(function(f) {
                    f.classList.remove('has-error');
                });
            }

            function marcarErro(id) {
                var el = document.getElementById(id);
                if (el) el.classList.add('has-error');
            }

            function validar(ganho, custos, dias, horas) {
                var ok = true;

                if (!ganho || ganho <= 0 || isNaN(ganho)) {
                    marcarErro('field-ganho');
                    ok = false;
                }
                if (isNaN(custos) || custos < 0) {
                    marcarErro('field-custos');
                    ok = false;
                }
                if (!dias || dias < 1 || dias > 7 || isNaN(dias)) {
                    marcarErro('field-dias');
                    ok = false;
                }
                if (!horas || horas < 1 || horas > 16 || isNaN(horas)) {
                    marcarErro('field-horas');
                    ok = false;
                }
                return ok;
            }

            // =========== RENDERIZAÇÃO ===========

            function renderizarResultado(dados) {
                // Valor da hora em destaque
                valHora.textContent = formatBRL(dados.valorHora);
                rateSub.textContent = 'base: ' + dados.horasMes + 'h/mês (' + dados.dias + ' dias × ' + dados.horas + 'h × 4 semanas)';

                // Métricas
                valBruto.textContent = formatBRL(dados.bruto);
                valHorasMes.textContent = dados.horasMes + 'h';

                var custoPct = dados.bruto > 0 ? ((dados.custos / dados.bruto) * 100).toFixed(1) : 0;
                valCustoPct.textContent = custoPct + '%';

                // Barra de composição
                var incomePct = dados.bruto > 0 ? (dados.ganho / dados.bruto) * 100 : 100;
                var costsPct = 100 - incomePct;

                barIncome.style.width = '0%';
                barCosts.style.width = '0%';

                requestAnimationFrame(function() {
                    requestAnimationFrame(function() {
                        barIncome.style.width = incomePct + '%';
                        barCosts.style.width = costsPct + '%';
                    });
                });

                legendIncome.textContent = 'Seu ganho: ' + formatBRL(dados.ganho);
                legendCosts.textContent = 'Custos fixos: ' + formatBRL(dados.custos);

                // Valor com margem (+25%)
                valComMargem.textContent = formatBRL(dados.valorHora * 1.25) + '/hora';

                resultadoEl.classList.add('is-visible');

                setTimeout(function() {
                    resultadoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
            }

            // =========== SUBMIT HANDLER ===========

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                limparErros();

                var ganho = parseFloat(document.getElementById('ganho').value);
                var custos = parseFloat(document.getElementById('custos').value) || 0;
                var dias = parseInt(document.getElementById('dias').value, 10);
                var horas = parseFloat(document.getElementById('horas').value);

                if (!validar(ganho, custos, dias, horas)) return;

                // --- Cálculos ---
                var bruto = ganho + custos;
                var horasMes = dias * horas * 4;
                var valorHora = bruto / horasMes;

                renderizarResultado({
                    ganho: ganho,
                    custos: custos,
                    dias: dias,
                    horas: horas,
                    bruto: bruto,
                    horasMes: horasMes,
                    valorHora: valorHora
                });
            });

            // Limpa erros ao interagir
            form.addEventListener('input', function(e) {
                var field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
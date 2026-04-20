/**
         * PodeCalcular - Calculadora de TMB e Gasto Calórico Diário
         * -----------------------------------------------------------
         * Fórmula de Mifflin-St Jeor (1990):
         *   Homens:   TMB = (10 × peso) + (6.25 × altura) − (5 × idade) + 5
         *   Mulheres: TMB = (10 × peso) + (6.25 × altura) − (5 × idade) − 161
         *
         * TDEE = TMB × Fator de Atividade
         *   Sedentário:          1.200
         *   Levemente ativo:     1.375
         *   Moderadamente ativo: 1.550
         *   Muito ativo:         1.725
         *   Extremamente ativo:  1.900
         *
         * Metas sugeridas:
         *   Emagrecer:     TDEE − 500 kcal
         *   Manter:        TDEE
         *   Ganhar massa:  TDEE + 300 kcal
         */

        (function() {
            'use strict';

            // =========== REFERÊNCIAS DOM ===========
            var form = document.getElementById('formTMB');
            var resultadoEl = document.getElementById('resultado');

            var valTMB       = document.getElementById('valTMB');
            var valTDEE      = document.getElementById('valTDEE');
            var barTMB       = document.getElementById('barTMB');
            var barTDEE      = document.getElementById('barTDEE');
            var valDeficit   = document.getElementById('valDeficit');
            var valManter    = document.getElementById('valManter');
            var valSuperavit = document.getElementById('valSuperavit');

            // =========== HELPERS ===========

            function formatNum(num) {
                return Math.round(num).toLocaleString('pt-BR');
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

            function validar(idade, peso, altura) {
                var ok = true;

                if (!idade || idade < 15 || idade > 100 || isNaN(idade)) {
                    marcarErro('field-idade');
                    ok = false;
                }
                if (!peso || peso < 30 || peso > 400 || isNaN(peso)) {
                    marcarErro('field-peso');
                    ok = false;
                }
                if (!altura || altura < 120 || altura > 250 || isNaN(altura)) {
                    marcarErro('field-altura');
                    ok = false;
                }
                return ok;
            }

            // =========== CÁLCULO MIFFLIN-ST JEOR ===========

            function calcTMB(genero, peso, altura, idade) {
                // TMB = (10 × peso) + (6.25 × altura) − (5 × idade) + constante
                var base = (10 * peso) + (6.25 * altura) - (5 * idade);
                return genero === 'masculino' ? base + 5 : base - 161;
            }

            // =========== RENDERIZAÇÃO ===========

            function renderizarResultado(tmb, tdee) {
                // Stat cards
                valTMB.textContent = formatNum(tmb);
                valTDEE.textContent = formatNum(tdee);

                // Barra visual — TDEE = 100%, TMB é proporção
                var maxRef = tdee * 1.15; // margem visual
                var tmbPercent = Math.min((tmb / maxRef) * 100, 100);
                var tdeePercent = Math.min((tdee / maxRef) * 100, 100);

                // Resetamos para animar (removendo e re-adicionando)
                barTMB.style.width = '0%';
                barTDEE.style.width = '0%';

                requestAnimationFrame(function() {
                    requestAnimationFrame(function() {
                        barTMB.style.width = tmbPercent + '%';
                        barTDEE.style.width = tdeePercent + '%';
                    });
                });

                // Metas
                var deficit = Math.max(tdee - 500, tmb); // nunca abaixo da TMB
                var manter = tdee;
                var superavit = tdee + 300;

                valDeficit.textContent = formatNum(deficit) + ' kcal';
                valManter.textContent = formatNum(manter) + ' kcal';
                valSuperavit.textContent = formatNum(superavit) + ' kcal';

                resultadoEl.classList.add('is-visible');

                setTimeout(function() {
                    resultadoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
            }

            // =========== SUBMIT HANDLER ===========

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                limparErros();

                var genero = document.querySelector('input[name="genero"]:checked').value;
                var idade  = parseInt(document.getElementById('idade').value, 10);
                var peso   = parseFloat(document.getElementById('peso').value);
                var altura = parseFloat(document.getElementById('altura').value);
                var fator  = parseFloat(document.getElementById('atividade').value);

                if (!validar(idade, peso, altura)) {
                    return;
                }

                var tmb  = calcTMB(genero, peso, altura, idade);
                var tdee = tmb * fator;

                renderizarResultado(tmb, tdee);
            });

            // Limpa erros ao interagir
            form.addEventListener('input', function(e) {
                var field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });
            form.addEventListener('change', function(e) {
                var field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
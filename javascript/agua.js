/**
         * PodeCalcular - Calculadora de Água Diária
         * -------------------------------------------
         * Regra base:
         *   Sem atividade intensa: 35 ml × peso (kg)
         *   Com atividade intensa: 45 ml × peso (kg)
         *
         * Equivalências:
         *   Copos de 250 ml
         *   Garrafas de 500 ml
         *   Frequência ao longo do dia (≈ 15h acordado)
         */

        (function() {
            'use strict';

            // =========== REFERÊNCIAS DOM ===========
            var form = document.getElementById('formAgua');
            var resultadoEl = document.getElementById('resultado');
            var valLitros = document.getElementById('valLitros');
            var valMl = document.getElementById('valMl');
            var cupsLabel = document.getElementById('cupsLabel');
            var cupsGrid = document.getElementById('cupsGrid');
            var infoFrequencia = document.getElementById('infoFrequencia');
            var infoGarrafas = document.getElementById('infoGarrafas');

            // =========== HELPERS ===========

            /**
             * Cria o SVG de um copo de água com delay de animação.
             */
            function criarCopoSVG(index) {
                var cup = document.createElement('div');
                cup.className = 'cup';
                cup.style.animationDelay = (index * 0.04) + 's';
                cup.innerHTML =
                    '<svg viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M4 4 L6 38 C6 40 8 42 10 42 L22 42 C24 42 26 40 26 38 L28 4 Z" ' +
                              'fill="#ECFEFF" stroke="#0891B2" stroke-width="1.5" stroke-linejoin="round"/>' +
                        '<path d="M6.5 16 L7.5 38 C7.5 39.5 9 41 10.5 41 L21.5 41 C23 41 24.5 39.5 24.5 38 L25.5 16 Z" ' +
                              'fill="#22D3EE" opacity="0.5"/>' +
                        '<line x1="4" y1="4" x2="28" y2="4" stroke="#0891B2" stroke-width="2" stroke-linecap="round"/>' +
                    '</svg>';
                return cup;
            }

            /**
             * Calcula a frequência ideal (horas acordado ÷ copos).
             * Considera ~15 horas acordado (das 7h às 22h).
             */
            function calcFrequencia(copos) {
                if (copos <= 0) return '—';
                var horasAcordado = 15;
                var minutosTotal = horasAcordado * 60;
                var intervalo = minutosTotal / copos;

                if (intervalo >= 60) {
                    var horas = Math.floor(intervalo / 60);
                    var minutos = Math.round(intervalo % 60);
                    if (minutos === 0) return horas + 'h';
                    return horas + 'h' + (minutos < 10 ? '0' : '') + minutos;
                }
                return Math.round(intervalo) + ' min';
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

            function validar(peso) {
                if (!peso || peso < 20 || peso > 300 || isNaN(peso)) {
                    marcarErro('field-peso');
                    return false;
                }
                return true;
            }

            // =========== RENDERIZAÇÃO ===========

            function renderizarResultado(totalMl, peso) {
                var litros = totalMl / 1000;
                var copos = Math.ceil(totalMl / 250);
                var garrafas = (totalMl / 500).toFixed(1).replace('.', ',');
                var freq = calcFrequencia(copos);

                // Valores principais
                valLitros.textContent = litros.toFixed(1).replace('.', ',');
                valMl.textContent = Math.round(totalMl).toLocaleString('pt-BR') + ' ml';

                // Copos
                cupsLabel.innerHTML = 'Equivale a <strong>' + copos + ' copos</strong> de 250 ml';
                cupsGrid.innerHTML = '';
                for (var i = 0; i < copos; i++) {
                    cupsGrid.appendChild(criarCopoSVG(i));
                }

                // Info rows
                infoFrequencia.innerHTML = 'Tente beber <strong>1 copo a cada ' + freq + '</strong> ao longo do dia (das 7h às 22h).';
                infoGarrafas.innerHTML = 'Isso equivale a aproximadamente <strong>' + garrafas + ' garrafas</strong> de 500 ml.';

                resultadoEl.classList.add('is-visible');

                setTimeout(function() {
                    resultadoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
            }

            // =========== SUBMIT HANDLER ===========

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                limparErros();

                var peso = parseFloat(document.getElementById('peso').value);
                var ativo = document.querySelector('input[name="atividade"]:checked').value === 'sim';

                if (!validar(peso)) return;

                // Cálculo: 35 ml/kg (sedentário) ou 45 ml/kg (ativo)
                var mlPorKg = ativo ? 45 : 35;
                var totalMl = mlPorKg * peso;

                renderizarResultado(totalMl, peso);
            });

            // Limpa erros ao interagir
            form.addEventListener('input', function(e) {
                var field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
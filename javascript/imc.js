/**
         * PodeCalcular - Calculadora de IMC
         * -----------------------------------
         * Fórmula: IMC = peso (kg) / altura² (m)
         *
         * Classificação OMS (adultos):
         *   < 18.5          Abaixo do peso
         *   18.5 - 24.9     Peso normal
         *   25.0 - 29.9     Sobrepeso
         *   30.0 - 34.9     Obesidade Grau I
         *   35.0 - 39.9     Obesidade Grau II
         *   >= 40.0         Obesidade Grau III
         */

        (function() {
            'use strict';

            // =========== REFERÊNCIAS DOM ===========
            const form = document.getElementById('formIMC');
            const resultadoEl = document.getElementById('resultado');
            const imcDisplay = document.getElementById('imcDisplay');
            const imcValue = document.getElementById('imcValue');
            const imcLabel = document.getElementById('imcLabel');
            const imcMarker = document.getElementById('imcMarker');
            const imcRangeInfo = document.getElementById('imcRangeInfo');
            const imcRangeDot = document.getElementById('imcRangeDot');
            const imcRangeText = document.getElementById('imcRangeText');

            // =========== CLASSIFICAÇÕES IMC (OMS) ===========
            var classifications = [
                {
                    max: 18.5,
                    label: 'Abaixo do peso',
                    color: 'var(--imc-underweight)',
                    bg: 'var(--imc-underweight-bg)',
                    risk: 'Risco aumentado'
                },
                {
                    max: 25,
                    label: 'Peso normal',
                    color: 'var(--imc-normal)',
                    bg: 'var(--imc-normal-bg)',
                    risk: 'Risco baixo'
                },
                {
                    max: 30,
                    label: 'Sobrepeso',
                    color: 'var(--imc-overweight)',
                    bg: 'var(--imc-overweight-bg)',
                    risk: 'Risco aumentado'
                },
                {
                    max: 35,
                    label: 'Obesidade Grau I',
                    color: 'var(--imc-obese1)',
                    bg: 'var(--imc-obese1-bg)',
                    risk: 'Risco alto'
                },
                {
                    max: 40,
                    label: 'Obesidade Grau II',
                    color: 'var(--imc-obese2)',
                    bg: 'var(--imc-obese2-bg)',
                    risk: 'Risco muito alto'
                },
                {
                    max: Infinity,
                    label: 'Obesidade Grau III',
                    color: 'var(--imc-obese3)',
                    bg: 'var(--imc-obese3-bg)',
                    risk: 'Risco extremamente alto'
                }
            ];

            // =========== HELPERS ===========

            /**
             * Retorna a classificação OMS com base no valor do IMC.
             */
            function getClassification(imc) {
                for (var i = 0; i < classifications.length; i++) {
                    if (imc < classifications[i].max) {
                        return classifications[i];
                    }
                }
                return classifications[classifications.length - 1];
            }

            /**
             * Converte o valor do IMC em posição percentual na barra de escala.
             * A barra vai visualmente de IMC 14 (0%) a IMC 42 (100%).
             */
            function imcToPercent(imc) {
                var min = 14;
                var max = 42;
                var clamped = Math.max(min, Math.min(max, imc));
                return ((clamped - min) / (max - min)) * 100;
            }

            /**
             * Calcula a faixa de peso ideal (IMC 18.5 a 24.9) para uma dada altura.
             */
            function pesoIdeal(altura) {
                var min = 18.5 * (altura * altura);
                var max = 24.9 * (altura * altura);
                return { min: min, max: max };
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

            function validar(peso, altura) {
                var ok = true;

                if (!peso || peso <= 0 || peso > 400 || isNaN(peso)) {
                    marcarErro('field-peso');
                    ok = false;
                }

                // Detecta se o usuário digitou em centímetros (> 3) e converte
                if (altura > 3 && altura <= 280) {
                    document.getElementById('altura').value = (altura / 100).toFixed(2);
                    altura = altura / 100;
                }

                if (!altura || altura < 0.5 || altura > 2.8 || isNaN(altura)) {
                    marcarErro('field-altura');
                    ok = false;
                }

                return ok;
            }

            // =========== RENDERIZAÇÃO ===========

            function renderizarResultado(imc, peso, altura) {
                var classif = getClassification(imc);
                var ideal = pesoIdeal(altura);

                // Atualiza o bloco central
                imcValue.textContent = imc.toFixed(1).replace('.', ',');
                imcLabel.textContent = classif.label;
                imcDisplay.style.backgroundColor = classif.bg;
                imcDisplay.style.color = classif.color;

                // Move o marcador na barra de escala
                var percent = imcToPercent(imc);
                imcMarker.style.left = percent + '%';
                imcMarker.style.borderColor = classif.color;

                // Info de faixa de peso ideal
                imcRangeDot.style.backgroundColor = classif.color;
                imcRangeText.innerHTML =
                    '<strong>' + classif.label + '</strong> — ' + classif.risk + '.<br>' +
                    'Para sua altura (' + altura.toFixed(2).replace('.', ',') + ' m), ' +
                    'o peso ideal fica entre <strong>' + ideal.min.toFixed(1).replace('.', ',') +
                    ' kg</strong> e <strong>' + ideal.max.toFixed(1).replace('.', ',') + ' kg</strong>.';

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
                var altura = parseFloat(document.getElementById('altura').value);

                // Auto-correção: se o usuário digitou cm (ex: 175), converte
                if (altura > 3 && altura <= 280) {
                    altura = altura / 100;
                    document.getElementById('altura').value = altura.toFixed(2);
                }

                if (!validar(peso, altura)) {
                    return;
                }

                // Fórmula: IMC = peso / altura²
                var imc = peso / (altura * altura);

                renderizarResultado(imc, peso, altura);
            });

            // Limpa erros ao interagir
            form.addEventListener('input', function(e) {
                var field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
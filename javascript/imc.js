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
         *
         * A classificação usa o IMC arredondado a uma casa decimal, o mesmo
         * valor exibido na tela, como na tabela da OMS.
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
            const memoriaCalculoEl = document.getElementById('memoriaCalculo');

            // =========== CLASSIFICAÇÕES IMC (OMS) ===========
            var classifications = [
                {
                    max: 18.5,
                    label: 'Abaixo do peso',
                    faixa: 'abaixo de 18,5',
                    color: 'var(--imc-underweight)',
                    bg: 'var(--imc-underweight-bg)',
                    risk: 'Risco aumentado'
                },
                {
                    max: 25,
                    label: 'Peso normal',
                    faixa: 'de 18,5 a 24,9',
                    color: 'var(--imc-normal)',
                    bg: 'var(--imc-normal-bg)',
                    risk: 'Risco baixo'
                },
                {
                    max: 30,
                    label: 'Sobrepeso',
                    faixa: 'de 25,0 a 29,9',
                    color: 'var(--imc-overweight)',
                    bg: 'var(--imc-overweight-bg)',
                    risk: 'Risco aumentado'
                },
                {
                    max: 35,
                    label: 'Obesidade Grau I',
                    faixa: 'de 30,0 a 34,9',
                    color: 'var(--imc-obese1)',
                    bg: 'var(--imc-obese1-bg)',
                    risk: 'Risco alto'
                },
                {
                    max: 40,
                    label: 'Obesidade Grau II',
                    faixa: 'de 35,0 a 39,9',
                    color: 'var(--imc-obese2)',
                    bg: 'var(--imc-obese2-bg)',
                    risk: 'Risco muito alto'
                },
                {
                    max: Infinity,
                    label: 'Obesidade Grau III',
                    faixa: '40,0 ou mais',
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

            /**
             * Formata número no padrão brasileiro, com casas decimais variáveis.
             */
            function formatNum(v, min, max) {
                return v.toLocaleString('pt-BR', { minimumFractionDigits: min, maximumFractionDigits: max });
            }

            // =========== MEMÓRIA DE CÁLCULO ===========

            /**
             * Gera o passo a passo do IMC com os dados do próprio usuário.
             */
            function gerarMemoriaCalculo(d) {
                var alt = formatNum(d.altura, 2, 2);
                var alt2 = formatNum(d.altura * d.altura, 2, 4);
                var peso = formatNum(d.peso, 0, 2);
                var imcExato = formatNum(d.imc, 2, 2);
                var imcArred = formatNum(d.imcArred, 1, 1);
                var itens = [];

                if (d.convertidoDeCm) {
                    itens.push(
                        '<li><strong>Altura em metros:</strong> você digitou ' + formatNum(d.altura * 100, 0, 0) +
                        ', que entendemos como centímetros. A fórmula usa metros, então a altura considerada é ' +
                        '<strong>' + alt + ' m</strong>.</li>'
                    );
                }

                itens.push(
                    '<li><strong>Altura ao quadrado:</strong> ' + alt + ' × ' + alt + ' = <strong>' + alt2 +
                    ' m²</strong>.</li>'
                );

                var arredondou = imcExato !== formatNum(d.imcArred, 2, 2);
                itens.push(
                    '<li><strong>IMC:</strong> peso ÷ (altura × altura) = ' + peso + ' kg ÷ ' + alt2 + ' m² = ' +
                    imcExato + (arredondou ? ', que arredondamos para uma casa decimal' : '') +
                    '. Seu IMC é <strong>' + imcArred + '</strong>.</li>'
                );

                var faixaTexto = d.classif.faixa.indexOf('de ') === 0
                    ? 'que vai ' + d.classif.faixa
                    : 'que corresponde a IMC ' + d.classif.faixa;
                itens.push(
                    '<li><strong>Classificação da OMS:</strong> seu IMC é ' + imcArred + ', o que está na faixa de ' +
                    '<strong>' + d.classif.label + '</strong>, ' + faixaTexto + '.</li>'
                );

                itens.push(
                    '<li><strong>Peso na faixa normal para a sua altura:</strong> é só fazer a conta ao contrário, ' +
                    'multiplicando os limites da faixa pela altura ao quadrado: 18,5 × ' + alt2 + ' = <strong>' +
                    formatNum(d.ideal.min, 1, 1) + ' kg</strong> e 24,9 × ' + alt2 + ' = <strong>' +
                    formatNum(d.ideal.max, 1, 1) + ' kg</strong>.</li>'
                );

                return '' +
                    '<h3 class="memoria-calculo__titulo">Memória de cálculo: como chegamos a esse valor</h3>' +
                    '<ol class="memoria-calculo__lista">' + itens.join('') + '</ol>' +
                    '<p class="memoria-calculo__nota">As faixas são da Organização Mundial da Saúde e valem para ' +
                    'adultos. Para crianças e adolescentes, a avaliação usa curvas de crescimento por idade e sexo.</p>';
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

            function renderizarResultado(imc, peso, altura, convertidoDeCm) {
                // Classifica pelo valor exibido (uma casa decimal), evitando que
                // 24,96 apareça como "25,0" e seja classificado como peso normal
                var imcArred = Math.round(imc * 10) / 10;
                var classif = getClassification(imcArred);
                var ideal = pesoIdeal(altura);

                // Atualiza o bloco central
                imcValue.textContent = imcArred.toFixed(1).replace('.', ',');
                imcLabel.textContent = classif.label;
                imcDisplay.style.backgroundColor = classif.bg;
                imcDisplay.style.color = classif.color;

                // Move o marcador na barra de escala
                var percent = imcToPercent(imcArred);
                imcMarker.style.left = percent + '%';
                imcMarker.style.borderColor = classif.color;

                // Info de faixa de peso ideal
                imcRangeDot.style.backgroundColor = classif.color;
                imcRangeText.innerHTML =
                    '<strong>' + classif.label + '</strong> — ' + classif.risk + '.<br>' +
                    'Para sua altura (' + altura.toFixed(2).replace('.', ',') + ' m), ' +
                    'o peso ideal fica entre <strong>' + ideal.min.toFixed(1).replace('.', ',') +
                    ' kg</strong> e <strong>' + ideal.max.toFixed(1).replace('.', ',') + ' kg</strong>.';

                memoriaCalculoEl.innerHTML = gerarMemoriaCalculo({
                    peso: peso,
                    altura: altura,
                    imc: imc,
                    imcArred: imcArred,
                    classif: classif,
                    ideal: ideal,
                    convertidoDeCm: convertidoDeCm
                });

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
                var convertidoDeCm = altura > 3 && altura <= 280;
                if (convertidoDeCm) {
                    altura = altura / 100;
                    document.getElementById('altura').value = altura.toFixed(2);
                }

                if (!validar(peso, altura)) {
                    return;
                }

                // Fórmula: IMC = peso / altura²
                var imc = peso / (altura * altura);

                renderizarResultado(imc, peso, altura, convertidoDeCm);
            });

            // Limpa erros ao interagir
            form.addEventListener('input', function(e) {
                var field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
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
            var memoriaCalculoEl = document.getElementById('memoriaCalculo');

            var ML_POR_KG_BASE = 35;
            var ML_POR_KG_ATIVIDADE = 45;

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

            /**
             * Formata no padrão brasileiro com casas decimais entre min e max.
             */
            function formatDec(num, min, max) {
                return num.toLocaleString('pt-BR', { minimumFractionDigits: min, maximumFractionDigits: max });
            }

            /**
             * Litros com duas casas, arredondando para o mais próximo de verdade
             * (toFixed arredonda conforme a representação binária: 3,15 virava 3,1).
             */
            function litrosDe(ml) {
                return Math.round(ml / 10) / 100;
            }

            // =========== MEMÓRIA DE CÁLCULO ===========

            /**
             * Gera o passo a passo da recomendação de água com o peso do usuário.
             */
            function gerarMemoriaCalculo(d) {
                var peso = formatDec(d.peso, 0, 1);
                var itens = [];

                itens.push(
                    '<li><strong>Base:</strong> a recomendação geral é de ' + ML_POR_KG_BASE + ' ml por kg de peso. ' +
                    'Para seus ' + peso + ' kg: ' + peso + ' × ' + ML_POR_KG_BASE + ' = <strong>' +
                    formatDec(d.baseMl, 0, 1) + ' ml</strong>.</li>'
                );

                if (d.ativo) {
                    var extra = ML_POR_KG_ATIVIDADE - ML_POR_KG_BASE;
                    itens.push(
                        '<li><strong>Acréscimo pela atividade física intensa:</strong> quem treina perde mais ' +
                        'água no suor, então somamos mais ' + extra + ' ml por kg: ' + peso + ' × ' + extra + ' = <strong>+ ' +
                        formatDec(d.extraMl, 0, 1) + ' ml</strong>. No total, ' + formatDec(d.baseMl, 0, 1) + ' + ' +
                        formatDec(d.extraMl, 0, 1) + ' = ' + formatDec(d.totalExato, 0, 1) + ' ml, o mesmo que ' +
                        peso + ' × ' + ML_POR_KG_ATIVIDADE + ' ml.</li>'
                    );
                }

                if (d.totalExato !== d.totalMl) {
                    itens.push(
                        '<li><strong>Arredondamento:</strong> ' + formatDec(d.totalExato, 0, 1) + ' ml ficam ' +
                        '<strong>' + formatDec(d.totalMl, 0, 0) + ' ml</strong>.</li>'
                    );
                }

                itens.push(
                    '<li><strong>Em litros:</strong> 1 litro tem 1.000 ml, então ' + formatDec(d.totalMl, 0, 0) +
                    ' ml ÷ 1.000 = <strong>' + formatDec(d.litros, 2, 2) + ' litros</strong>' +
                    (litrosDe(d.totalMl) * 1000 !== d.totalMl ? ' (arredondado para duas casas)' : '') + '.</li>'
                );

                itens.push(
                    '<li><strong>Em copos:</strong> ' + formatDec(d.totalMl, 0, 0) + ' ml ÷ 250 ml = ' +
                    formatDec(d.totalMl / 250, 0, 2) + ', que arredondamos para cima: <strong>' + d.copos +
                    ' copos</strong>, para não ficar abaixo da meta.</li>'
                );

                return '' +
                    '<h3 class="memoria-calculo__titulo">Memória de cálculo: como chegamos a esse valor</h3>' +
                    '<ol class="memoria-calculo__lista">' + itens.join('') + '</ol>' +
                    '<p class="memoria-calculo__nota">A conta por quilo é uma referência geral para adultos ' +
                    'saudáveis, usada em orientações de nutrição, e inclui a água vinda de chás, sucos e alimentos. ' +
                    'Doenças renais ou cardíacas, gestação, amamentação, calor intenso e alguns medicamentos podem ' +
                    'exigir uma recomendação diferente, que deve vir do seu médico.</p>';
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

            function renderizarResultado(totalMl, peso, dados) {
                var litros = litrosDe(totalMl);
                var copos = Math.ceil(totalMl / 250);
                var garrafas = (totalMl / 500).toFixed(1).replace('.', ',');
                var freq = calcFrequencia(copos);

                // Valores principais
                valLitros.textContent = formatDec(litros, 2, 2);
                valMl.textContent = totalMl.toLocaleString('pt-BR') + ' ml';

                // Copos
                cupsLabel.innerHTML = 'Equivale a <strong>' + copos + ' copos</strong> de 250 ml';
                cupsGrid.innerHTML = '';
                for (var i = 0; i < copos; i++) {
                    cupsGrid.appendChild(criarCopoSVG(i));
                }

                // Info rows
                infoFrequencia.innerHTML = 'Tente beber <strong>1 copo a cada ' + freq + '</strong> ao longo do dia (das 7h às 22h).';
                infoGarrafas.innerHTML = 'Isso equivale a aproximadamente <strong>' + garrafas + ' garrafas</strong> de 500 ml.';

                dados.totalMl = totalMl;
                dados.litros = litros;
                dados.copos = copos;
                memoriaCalculoEl.innerHTML = gerarMemoriaCalculo(dados);

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

                // Cálculo: 35 ml/kg de base + 10 ml/kg com atividade intensa (= 45 ml/kg).
                // Arredonda a 1 casa para tirar ruído de ponto flutuante (70,3 × 45
                // dava 3163,4999…) e depois para o ml inteiro exibido.
                var baseMl = Math.round(ML_POR_KG_BASE * peso * 10) / 10;
                var extraMl = ativo ? Math.round((ML_POR_KG_ATIVIDADE - ML_POR_KG_BASE) * peso * 10) / 10 : 0;
                var totalExato = Math.round((baseMl + extraMl) * 10) / 10;
                var totalMl = Math.round(totalExato);

                renderizarResultado(totalMl, peso, {
                    peso: peso,
                    ativo: ativo,
                    baseMl: baseMl,
                    extraMl: extraMl,
                    totalExato: totalExato
                });
            });

            // Limpa erros ao interagir
            form.addEventListener('input', function(e) {
                var field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
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
            var memoriaCalculoEl = document.getElementById('memoriaCalculo');

            // =========== HELPERS ===========

            function formatNum(num) {
                return Math.round(num).toLocaleString('pt-BR');
            }

            /**
             * Formata no padrão brasileiro com até `max` casas (sem zeros sobrando).
             */
            function formatDec(num, max) {
                return num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: max });
            }

            // =========== MEMÓRIA DE CÁLCULO ===========

            /**
             * Gera o passo a passo da TMB e do gasto calórico total com os dados do usuário.
             */
            function gerarMemoriaCalculo(d) {
                var masc = d.genero === 'masculino';
                var parcelaPeso = 10 * d.peso;
                var parcelaAltura = 6.25 * d.altura;
                var parcelaIdade = 5 * d.idade;
                var fatorSexo = masc ? '+ 5' : '− 161';
                var itens = [];

                itens.push(
                    '<li><strong>Equação de Mifflin-St Jeor:</strong> TMB = (10 × peso em kg) + (6,25 × altura em cm) ' +
                    '− (5 × idade em anos) ' + fatorSexo + '. O último termo depende do sexo biológico: ' +
                    'soma 5 para o masculino e subtrai 161 para o feminino. Você marcou <strong>' +
                    (masc ? 'masculino' : 'feminino') + '</strong>.</li>'
                );

                itens.push(
                    '<li><strong>Com os seus dados:</strong> (10 × ' + formatDec(d.peso, 2) + ') + (6,25 × ' +
                    formatDec(d.altura, 2) + ') − (5 × ' + d.idade + ') ' + fatorSexo + ' = ' +
                    formatDec(parcelaPeso, 2) + ' + ' + formatDec(parcelaAltura, 2) + ' − ' + formatDec(parcelaIdade, 2) +
                    ' ' + fatorSexo + ' = <strong>' + formatDec(d.tmb, 2) + ' kcal</strong>' +
                    (Math.round(d.tmb) !== d.tmb ? ', que arredondamos para ' + formatNum(d.tmb) + ' kcal' : '') +
                    '. Essa é a sua taxa metabólica basal: a energia que o corpo gasta em repouso total, só para ' +
                    'manter respiração, circulação e temperatura.</li>'
                );

                itens.push(
                    '<li><strong>Gasto calórico total diário:</strong> a TMB é multiplicada pelo fator do nível de ' +
                    'atividade que você escolheu, <em>' + d.atividadeTexto + '</em>, que é <strong>' +
                    formatDec(d.fator, 3) + '</strong>: ' + formatDec(d.tmb, 2) + ' × ' + formatDec(d.fator, 3) + ' = ' +
                    formatDec(d.tdee, 2) + ', ou cerca de <strong>' + formatNum(d.tdee) + ' kcal por dia</strong>. ' +
                    'É o quanto você gasta somando o metabolismo em repouso às atividades do dia e aos exercícios.</li>'
                );

                itens.push(
                    '<li><strong>Metas:</strong> para emagrecer, a sugestão é comer cerca de 500 kcal a menos que o ' +
                    'gasto total (' + formatNum(d.tdee) + ' − 500' +
                    (d.deficitLimitado ? ', mas sem ficar abaixo da TMB, por isso ' + formatNum(d.deficit) + ' kcal'
                                       : ' = ' + formatNum(d.deficit) + ' kcal') +
                    '); para ganhar massa, cerca de 300 kcal a mais (' + formatNum(d.tdee) + ' + 300 = ' +
                    formatNum(d.superavit) + ' kcal).</li>'
                );

                return '' +
                    '<h3 class="memoria-calculo__titulo">Memória de cálculo: como chegamos a esses valores</h3>' +
                    '<ol class="memoria-calculo__lista">' + itens.join('') + '</ol>' +
                    '<p class="memoria-calculo__nota">A equação de Mifflin-St Jeor (1990) foi validada em estudos ' +
                    'científicos e é apontada em revisões como uma das mais precisas para estimar a TMB de adultos. ' +
                    'Ainda assim, é uma estimativa: o metabolismo varia de pessoa para pessoa conforme a massa ' +
                    'muscular, os hormônios, a genética, o sono e o uso de medicamentos.</p>';
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

            function renderizarResultado(tmb, tdee, dados) {
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

                dados.tmb = tmb;
                dados.tdee = tdee;
                dados.deficit = deficit;
                dados.deficitLimitado = tdee - 500 < tmb;
                dados.superavit = superavit;
                memoriaCalculoEl.innerHTML = gerarMemoriaCalculo(dados);

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

                var atividadeEl = document.getElementById('atividade');
                renderizarResultado(tmb, tdee, {
                    genero: genero,
                    idade: idade,
                    peso: peso,
                    altura: altura,
                    fator: fator,
                    atividadeTexto: atividadeEl.options[atividadeEl.selectedIndex].text.trim()
                });
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
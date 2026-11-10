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
            var memoriaCalculoEl = document.getElementById('memoriaCalculo');

            var SEMANAS_POR_MES = 4;
            var MARGEM_SEGURANCA = 0.25;

            // =========== HELPERS ===========

            function formatBRL(valor) {
                return valor.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }

            /**
             * Número no padrão brasileiro, sem zeros sobrando (4,5 / 90 / 0,25).
             */
            function formatNum(v, max) {
                return v.toLocaleString('pt-BR', { maximumFractionDigits: max === undefined ? 2 : max });
            }

            /**
             * Horas por dia em decimal e, quando fracionadas, também em h:min (4,5 h = 4h30).
             */
            function formatHorasDia(h) {
                var inteiras = Math.floor(h);
                var minutos = Math.round((h - inteiras) * 60);
                var base = formatNum(h) + ' h';
                if (minutos === 0) return base;
                return base + ' (' + inteiras + 'h' + (minutos < 10 ? '0' : '') + minutos + ')';
            }

            function formatValorHora(v) {
                return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
            }

            // =========== MEMÓRIA DE CÁLCULO ===========

            /**
             * Gera o passo a passo do valor da hora com os dados do usuário.
             */
            function gerarMemoriaCalculo(d) {
                var itens = [];
                var exata = Math.round(d.valorHora * 100) / 100 === d.valorHora;

                itens.push(
                    '<li><strong>Quanto você precisa faturar por mês:</strong> a renda que quer receber mais os custos ' +
                    'fixos: ' + formatBRL(d.ganho) + ' + ' + formatBRL(d.custos) + ' = <strong>' + formatBRL(d.bruto) +
                    '</strong>.</li>'
                );

                itens.push(
                    '<li><strong>Total de horas no mês:</strong> dias por semana × horas por dia × ' + SEMANAS_POR_MES +
                    ' semanas: ' + d.dias + (d.dias === 1 ? ' dia' : ' dias') + ' × ' + formatHorasDia(d.horas) + ' × ' +
                    SEMANAS_POR_MES + ' = <strong>' + formatNum(d.horasMes) + ' horas</strong>. Um mês tem cerca de ' +
                    '4,33 semanas; usar 4 deixa de fora cerca de um terço de semana, que funciona como folga e torna ' +
                    'o valor da hora um pouco mais seguro.</li>'
                );

                itens.push(
                    '<li><strong>Valor da hora:</strong> faturamento necessário ÷ horas no mês: ' + formatBRL(d.bruto) +
                    ' ÷ ' + formatNum(d.horasMes) + ' h = <strong>' + formatValorHora(d.valorHora) + '</strong>' +
                    (exata ? '' : ', exibido como ' + formatBRL(d.valorHora)) +
                    '. É o mínimo para pagar suas contas e a sua renda se você vender todas essas horas.</li>'
                );

                itens.push(
                    '<li><strong>Margem de segurança de 25%:</strong> a sugestão fixa da calculadora acrescenta 25% ao ' +
                    'valor da hora para cobrir férias, dias de doença, impostos e o tempo gasto com orçamentos e ' +
                    'prospecção. O acréscimo é de ' + formatValorHora(d.valorHora) + ' × 25% = ' +
                    formatValorHora(d.acrescimoHora) + ' por hora, e o valor sugerido fica ' + formatValorHora(d.valorHora) +
                    ' × 1,25 = <strong>' + formatBRL(d.valorComMargem) + ' por hora</strong>. Vendendo as ' +
                    formatNum(d.horasMes) + ' horas a esse preço, a margem embute cerca de <strong>' +
                    formatBRL(d.reservaMes) + ' por mês</strong> de reserva.</li>'
                );

                return '' +
                    '<h3 class="memoria-calculo__titulo">Memória de cálculo: como chegamos a esse valor</h3>' +
                    '<ol class="memoria-calculo__lista">' + itens.join('') + '</ol>' +
                    '<p class="memoria-calculo__nota">Na prática, quase ninguém fatura todas as horas trabalhadas. Se ' +
                    'apenas parte delas for cobrada do cliente, informe só as horas faturáveis: o valor da hora sobe na ' +
                    'mesma proporção.</p>';
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
                rateSub.textContent = 'base: ' + formatNum(dados.horasMes) + 'h/mês (' + dados.dias + ' dias × ' +
                    formatNum(dados.horas) + 'h × ' + SEMANAS_POR_MES + ' semanas)';

                // Métricas
                valBruto.textContent = formatBRL(dados.bruto);
                valHorasMes.textContent = formatNum(dados.horasMes) + 'h';

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
                valComMargem.textContent = formatBRL(dados.valorComMargem) + '/hora';

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

                var ganho = parseFloat(document.getElementById('ganho').value);
                var custos = parseFloat(document.getElementById('custos').value) || 0;
                var dias = parseInt(document.getElementById('dias').value, 10);
                var horas = parseFloat(document.getElementById('horas').value);

                if (!validar(ganho, custos, dias, horas)) return;

                // --- Cálculos ---
                // Centavos e horas arredondados para tirar ruído de ponto flutuante
                var bruto = Math.round((ganho + custos) * 100) / 100;
                var horasMes = Math.round(dias * horas * SEMANAS_POR_MES * 100) / 100;
                var valorHora = bruto / horasMes;
                var valorComMargem = valorHora * (1 + MARGEM_SEGURANCA);

                renderizarResultado({
                    ganho: ganho,
                    custos: custos,
                    dias: dias,
                    horas: horas,
                    bruto: bruto,
                    horasMes: horasMes,
                    valorHora: valorHora,
                    acrescimoHora: valorHora * MARGEM_SEGURANCA,
                    valorComMargem: valorComMargem,
                    reservaMes: Math.round(bruto * MARGEM_SEGURANCA * 100) / 100
                });
            });

            // Limpa erros ao interagir
            form.addEventListener('input', function(e) {
                var field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
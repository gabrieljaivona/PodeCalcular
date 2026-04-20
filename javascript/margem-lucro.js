/**
         * PodeCalcular - Calculadora de Margem de Lucro
         * -----------------------------------------------
         * Fórmulas:
         *   Lucro Bruto       = Preço de Venda − Custo Total
         *   Margem de Lucro   = (Lucro Bruto / Preço de Venda) × 100
         *   Markup            = (Lucro Bruto / Custo Total) × 100
         *
         * Feedback visual:
         *   Margem > 0  → verde (lucro)
         *   Margem = 0  → amarelo (equilíbrio)
         *   Margem < 0  → vermelho (prejuízo)
         */

        (function() {
            'use strict';

            // =========== REFERÊNCIAS DOM ===========
            var form = document.getElementById('formMargem');
            var resultadoEl = document.getElementById('resultado');
            var resultKicker = document.getElementById('resultKicker');
            var resultTitle = document.getElementById('resultTitle');

            var cardLucro = document.getElementById('cardLucro');
            var cardMargem = document.getElementById('cardMargem');
            var cardMarkup = document.getElementById('cardMarkup');
            var valLucro = document.getElementById('valLucro');
            var valMargem = document.getElementById('valMargem');
            var valMarkup = document.getElementById('valMarkup');

            var barCost = document.getElementById('barCost');
            var barProfit = document.getElementById('barProfit');
            var legendCost = document.getElementById('legendCost');
            var legendProfit = document.getElementById('legendProfit');
            var legendProfitDot = document.getElementById('legendProfitDot');

            var alertBox = document.getElementById('alertBox');

            // =========== HELPERS ===========

            function formatBRL(v) {
                return v.toLocaleString('pt-BR', {
                    style: 'currency', currency: 'BRL',
                    minimumFractionDigits: 2, maximumFractionDigits: 2
                });
            }

            function formatPct(v) {
                return v.toFixed(2).replace('.', ',') + '%';
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

            function validar(custo, venda) {
                var ok = true;
                if (!custo || custo <= 0 || isNaN(custo)) {
                    marcarErro('field-custo');
                    ok = false;
                }
                if (!venda || venda <= 0 || isNaN(venda)) {
                    marcarErro('field-venda');
                    ok = false;
                }
                return ok;
            }

            // =========== RENDERIZAÇÃO ===========

            function renderizarResultado(custo, venda) {
                var lucro = venda - custo;
                var margem = (lucro / venda) * 100;
                var markup = (lucro / custo) * 100;

                var isPrejuizo = margem < 0;
                var isEquilibrio = margem === 0;

                // --- Kicker e título ---
                if (isPrejuizo) {
                    resultKicker.textContent = '⚠️ Atenção';
                    resultKicker.style.cssText = 'color: var(--color-loss-vivid); background-color: var(--color-loss-bg);';
                    resultTitle.textContent = 'Você está tendo prejuízo';
                } else if (isEquilibrio) {
                    resultKicker.textContent = '⚖️ Ponto de equilíbrio';
                    resultKicker.style.cssText = 'color: #92400E; background-color: var(--color-neutral-bg);';
                    resultTitle.textContent = 'Nenhum lucro nesta operação';
                } else {
                    resultKicker.textContent = '✓ Operação lucrativa';
                    resultKicker.style.cssText = 'color: var(--color-profit-vivid); background-color: var(--color-profit-bg);';
                    resultTitle.textContent = 'Análise da sua operação';
                }

                // --- Cards de métricas ---
                valLucro.textContent = formatBRL(lucro);
                valMargem.textContent = formatPct(margem);
                valMarkup.textContent = formatPct(markup);

                // Cores dinâmicas dos cards
                var lucroStyle = isPrejuizo ? 'metric-card--prejuizo' : 'metric-card--lucro';
                var margemStyle = isPrejuizo ? 'metric-card--prejuizo' : 'metric-card--margem';

                cardLucro.className = 'metric-card ' + lucroStyle;
                cardMargem.className = 'metric-card ' + margemStyle;
                cardMarkup.className = 'metric-card metric-card--markup';

                // --- Barra de composição ---
                var costPct, profitPct;

                if (isPrejuizo) {
                    // O custo ultrapassa o preço de venda
                    costPct = 100;
                    profitPct = 0;
                    barProfit.className = 'composition-bar__segment composition-bar__segment--loss';
                    // Mostra a barra de custo preenchendo tudo e o "prejuízo" como excedente visual
                    var overflowPct = ((custo - venda) / custo) * 100;
                    barCost.style.width = (100 - overflowPct) + '%';
                    barProfit.style.width = overflowPct + '%';
                    barCost.textContent = '';
                    barProfit.textContent = '';
                    legendProfitDot.style.backgroundColor = 'var(--color-loss)';
                    legendProfit.textContent = 'Prejuízo: ' + formatBRL(Math.abs(lucro));
                } else {
                    costPct = (custo / venda) * 100;
                    profitPct = 100 - costPct;
                    barProfit.className = 'composition-bar__segment composition-bar__segment--profit';

                    barCost.style.width = '0%';
                    barProfit.style.width = '0%';

                    requestAnimationFrame(function() {
                        requestAnimationFrame(function() {
                            barCost.style.width = costPct + '%';
                            barProfit.style.width = profitPct + '%';
                        });
                    });

                    barCost.textContent = costPct > 15 ? Math.round(costPct) + '%' : '';
                    barProfit.textContent = profitPct > 15 ? Math.round(profitPct) + '%' : '';
                    legendProfitDot.style.backgroundColor = 'var(--color-profit)';
                    legendProfit.textContent = 'Lucro: ' + formatBRL(lucro);
                }

                legendCost.textContent = 'Custo: ' + formatBRL(custo);

                // --- Alerta contextual ---
                alertBox.classList.remove('is-visible', 'alert-box--loss', 'alert-box--profit', 'alert-box--warn');

                if (isPrejuizo) {
                    alertBox.classList.add('is-visible', 'alert-box--loss');
                    alertBox.innerHTML = '<span aria-hidden="true">🚨</span> <span><strong>Atenção: Você está tendo prejuízo!</strong> Seu custo de ' + formatBRL(custo) + ' é maior que o preço de venda de ' + formatBRL(venda) + '. Você perde ' + formatBRL(Math.abs(lucro)) + ' a cada unidade vendida. Revise urgentemente a sua precificação.</span>';
                } else if (isEquilibrio) {
                    alertBox.classList.add('is-visible', 'alert-box--warn');
                    alertBox.innerHTML = '<span aria-hidden="true">⚖️</span> <span><strong>Ponto de equilíbrio.</strong> Você não está lucrando nem perdendo — o custo é igual ao preço de venda. Qualquer imprevisto gerará prejuízo.</span>';
                } else if (margem < 10) {
                    alertBox.classList.add('is-visible', 'alert-box--warn');
                    alertBox.innerHTML = '<span aria-hidden="true">⚠️</span> <span><strong>Margem muito baixa (' + formatPct(margem) + ').</strong> Margens abaixo de 10% deixam pouca margem de manobra para imprevistos, devoluções e variações de custo. Considere rever o preço.</span>';
                } else {
                    alertBox.classList.add('is-visible', 'alert-box--profit');
                    alertBox.innerHTML = '<span aria-hidden="true">✅</span> <span><strong>Margem saudável!</strong> A cada venda de ' + formatBRL(venda) + ', você lucra ' + formatBRL(lucro) + '. Seu markup de ' + formatPct(markup) + ' significa que o lucro equivale a ' + formatPct(markup) + ' do custo.</span>';
                }

                resultadoEl.classList.add('is-visible');

                setTimeout(function() {
                    resultadoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
            }

            // =========== SUBMIT HANDLER ===========

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                limparErros();

                var custo = parseFloat(document.getElementById('custo').value);
                var venda = parseFloat(document.getElementById('venda').value);

                if (!validar(custo, venda)) return;

                renderizarResultado(custo, venda);
            });

            form.addEventListener('input', function(e) {
                var field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
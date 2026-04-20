/**
         * PodeCalcular - Calculadora de Preço de Venda
         * -----------------------------------------------
         * Fórmula do Markup Divisor:
         *   Preço de Venda = Custo / (1 - ((Despesas% + Lucro%) / 100))
         *
         * Raio-X:
         *   Custo       = valor informado
         *   Taxas       = Preço × (Despesas / 100)
         *   Lucro       = Preço × (Margem / 100)
         *   Conferência = Custo + Taxas + Lucro === Preço
         */

        (function() {
            'use strict';

            var form = document.getElementById('formPreco');
            var resultadoEl = document.getElementById('resultado');

            var precoFinal = document.getElementById('precoFinal');
            var totalVal = document.getElementById('totalVal');

            var custoVal = document.getElementById('custoVal');
            var custoPct = document.getElementById('custoPct');
            var taxVal = document.getElementById('taxVal');
            var taxPct = document.getElementById('taxPct');
            var lucVal = document.getElementById('lucVal');
            var lucPct = document.getElementById('lucPct');

            var barCost = document.getElementById('barCost');
            var barTax = document.getElementById('barTax');
            var barProfit = document.getElementById('barProfit');
            var legCost = document.getElementById('legCost');
            var legTax = document.getElementById('legTax');
            var legProfit = document.getElementById('legProfit');

            var formulaText = document.getElementById('formulaText');
            var receiptDate = document.getElementById('receiptDate');

            // =========== HELPERS ===========

            function formatBRL(v) {
                return v.toLocaleString('pt-BR', {
                    style: 'currency', currency: 'BRL',
                    minimumFractionDigits: 2, maximumFractionDigits: 2
                });
            }

            function formatPct(v) {
                return v.toFixed(1).replace('.', ',') + '%';
            }

            function getDateStr() {
                var d = new Date();
                var dd = String(d.getDate()).padStart(2, '0');
                var mm = String(d.getMonth() + 1).padStart(2, '0');
                var yyyy = d.getFullYear();
                var hh = String(d.getHours()).padStart(2, '0');
                var min = String(d.getMinutes()).padStart(2, '0');
                return dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + min;
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

            function validar(custo, despesas, margem) {
                var ok = true;
                if (!custo || custo <= 0 || isNaN(custo)) {
                    marcarErro('field-custo'); ok = false;
                }
                if (isNaN(despesas) || despesas < 0 || despesas > 90) {
                    marcarErro('field-despesas'); ok = false;
                }
                if (!margem || margem <= 0 || margem > 90 || isNaN(margem)) {
                    marcarErro('field-margem'); ok = false;
                }
                if (ok && (despesas + margem) >= 100) {
                    marcarErro('field-despesas');
                    marcarErro('field-margem');
                    ok = false;
                }
                return ok;
            }

            // =========== RENDERIZAÇÃO ===========

            function renderizarResultado(custo, despesas, margem) {
                // Fórmula do markup divisor
                var divisor = 1 - ((despesas + margem) / 100);
                var preco = custo / divisor;

                // Raio-X do preço
                var taxasReais = preco * (despesas / 100);
                var lucroReais = preco * (margem / 100);
                var custoPctNum = (custo / preco) * 100;

                // Preço principal
                precoFinal.textContent = formatBRL(preco);
                totalVal.textContent = formatBRL(preco);

                // Linhas do raio-X
                custoVal.textContent = formatBRL(custo);
                custoPct.textContent = formatPct(custoPctNum) + ' do preço';

                taxVal.textContent = formatBRL(taxasReais);
                taxPct.textContent = formatPct(despesas) + ' do preço';

                lucVal.textContent = formatBRL(lucroReais);
                lucPct.textContent = formatPct(margem) + ' do preço';

                // Barra de composição
                barCost.style.width = '0%';
                barTax.style.width = '0%';
                barProfit.style.width = '0%';

                requestAnimationFrame(function() {
                    requestAnimationFrame(function() {
                        barCost.style.width = custoPctNum + '%';
                        barTax.style.width = despesas + '%';
                        barProfit.style.width = margem + '%';
                    });
                });

                barCost.textContent = custoPctNum > 12 ? Math.round(custoPctNum) + '%' : '';
                barTax.textContent = despesas > 12 ? Math.round(despesas) + '%' : '';
                barProfit.textContent = margem > 12 ? Math.round(margem) + '%' : '';

                legCost.textContent = 'Custo: ' + formatBRL(custo);
                legTax.textContent = 'Taxas: ' + formatBRL(taxasReais);
                legProfit.textContent = 'Lucro: ' + formatBRL(lucroReais);

                // Fórmula exibida
                formulaText.textContent =
                    formatBRL(custo) + ' ÷ (1 − (' +
                    formatPct(despesas) + ' + ' + formatPct(margem) + ') ÷ 100) = ' +
                    formatBRL(custo) + ' ÷ ' + divisor.toFixed(4).replace('.', ',') +
                    ' = ' + formatBRL(preco);

                // Data e hora
                receiptDate.textContent = 'Simulação gerada em ' + getDateStr();

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
                var despesas = parseFloat(document.getElementById('despesas').value) || 0;
                var margem = parseFloat(document.getElementById('margem').value);

                if (!validar(custo, despesas, margem)) return;

                renderizarResultado(custo, despesas, margem);
            });

            form.addEventListener('input', function(e) {
                var field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
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
            var memoriaCalculoEl = document.getElementById('memoriaCalculo');

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

            function formatNum(v, casas) {
                return v.toLocaleString('pt-BR', {
                    minimumFractionDigits: casas, maximumFractionDigits: casas
                });
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

            // =========== CÁLCULO ===========

            /**
             * Calcula o preço pelo markup divisor e decompõe o resultado em
             * centavos, para que custo + despesas + lucro feche exatamente
             * com o preço exibido (o lucro absorve o arredondamento).
             */
            function calcularPreco(custo, despesas, margem) {
                var divisor = 1 - ((despesas + margem) / 100);
                var preco = Math.round((custo / divisor) * 100) / 100;
                var custoArred = Math.round(custo * 100) / 100;
                var taxasReais = Math.round(preco * despesas) / 100;
                var lucroReais = Math.round((preco - custoArred - taxasReais) * 100) / 100;

                // Comparação com o erro comum de somar os percentuais sobre o custo
                var precoSomando = custo * (1 + (despesas + margem) / 100);
                var lucroSomando = precoSomando - custo - precoSomando * (despesas / 100);

                return {
                    custo: custoArred,
                    despesas: despesas,
                    margem: margem,
                    divisor: divisor,
                    preco: preco,
                    taxasReais: taxasReais,
                    lucroReais: lucroReais,
                    custoPct: (custo / preco) * 100,
                    markupMultiplicador: preco / custo,
                    markupPct: ((preco - custo) / custo) * 100,
                    lucroSobreCusto: (lucroReais / custo) * 100,
                    precoSomando: precoSomando,
                    margemSomando: (lucroSomando / precoSomando) * 100
                };
            }

            // =========== MEMÓRIA DE CÁLCULO ===========

            /**
             * Explica, com os números do usuário, como o preço foi composto.
             */
            function gerarMemoriaCalculo(d) {
                var itens = [];

                itens.push(
                    '<li><strong>Custo do produto:</strong> você informou <strong>' + formatBRL(d.custo) +
                    '</strong> (material, mercadoria e frete). Esse valor ocupa ' + formatPct(d.custoPct) +
                    ' do preço final.</li>'
                );

                itens.push(
                    '<li><strong>Impostos e taxas:</strong> ' + formatPct(d.despesas) + ' de despesas sobre a venda ' +
                    '(imposto sobre a nota, maquininha, comissão de plataforma) incidem sobre o <em>preço</em>, não sobre o custo: ' +
                    formatPct(d.despesas) + ' de ' + formatBRL(d.preco) + ' = <strong>' + formatBRL(d.taxasReais) +
                    '</strong>.</li>'
                );

                itens.push(
                    '<li><strong>Lucro desejado:</strong> é o que sobra depois de pagar o custo e as taxas: ' +
                    formatBRL(d.preco) + ' − ' + formatBRL(d.custo) + ' − ' + formatBRL(d.taxasReais) + ' = <strong>' +
                    formatBRL(d.lucroReais) + '</strong> no seu bolso por unidade, ou seja, a margem de ' +
                    formatPct(d.margem) + ' sobre o preço que você pediu. Em relação ao custo, esse lucro ' +
                    'equivale a ' + formatPct(d.lucroSobreCusto) + '.</li>'
                );

                itens.push(
                    '<li><strong>Markup divisor:</strong> somando despesas e lucro, ' + formatPct(d.despesas) +
                    ' + ' + formatPct(d.margem) + ' = ' + formatPct(d.despesas + d.margem) + ' do preço. Sobram ' +
                    formatPct(100 - d.despesas - d.margem) + ' para cobrir o custo, então o divisor é ' +
                    formatNum(d.divisor, 4) + ' e o preço é ' + formatBRL(d.custo) + ' ÷ ' + formatNum(d.divisor, 4) +
                    ' = <strong>' + formatBRL(d.preco) + '</strong>.</li>'
                );

                itens.push(
                    '<li><strong>Markup x margem:</strong> o preço equivale ao custo multiplicado por ' +
                    formatNum(d.markupMultiplicador, 3) + ' (markup de ' + formatPct(d.markupPct) +
                    ' sobre o custo), enquanto a margem de lucro é de ' + formatPct(d.margem) +
                    ' sobre o preço. São dois jeitos de olhar o mesmo valor.</li>'
                );

                return '' +
                    '<h3 class="memoria-calculo__titulo">Memória de cálculo: como chegamos a esse preço</h3>' +
                    '<ol class="memoria-calculo__lista">' + itens.join('') + '</ol>' +
                    '<p class="memoria-calculo__total">Conferência: ' + formatBRL(d.custo) + ' (custo) + ' +
                    formatBRL(d.taxasReais) + ' (impostos e taxas) + ' + formatBRL(d.lucroReais) +
                    ' (lucro) = <strong>' + formatBRL(d.preco) + '</strong>.</p>' +
                    '<p class="memoria-calculo__total">Se você simplesmente somasse ' + formatPct(d.despesas + d.margem) +
                    ' em cima do custo, cobraria ' + formatBRL(d.precoSomando) + ' e sua margem real cairia para ' +
                    formatPct(d.margemSomando) + ', e não os ' + formatPct(d.margem) + ' que você queria.</p>' +
                    '<p class="memoria-calculo__nota">Custos fixos, como aluguel, internet e a DAS em valor fixo, ' +
                    'não entram automaticamente: divida o total do mês pela quantidade de unidades que você vende ' +
                    'e some ao custo do produto, ou inclua esse peso no percentual de despesas.</p>';
            }

            // =========== RENDERIZAÇÃO ===========

            function renderizarResultado(custo, despesas, margem) {
                var d = calcularPreco(custo, despesas, margem);
                var divisor = d.divisor;
                var preco = d.preco;
                var taxasReais = d.taxasReais;
                var lucroReais = d.lucroReais;
                var custoPctNum = d.custoPct;

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

                memoriaCalculoEl.innerHTML = gerarMemoriaCalculo(d);

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
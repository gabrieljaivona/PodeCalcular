/**
         * PodeCalcular - Calculadora de 13º Salário
         * -------------------------------------------
         * Regras aplicadas (valores BRUTOS, sem descontos):
         *   - 13º proporcional = (salário ÷ 12) × meses trabalhados
         *   - 1ª parcela       = 50% do valor bruto (sem descontos)
         *   - 2ª parcela       = 50% do valor bruto (na prática, INSS e IRRF incidem aqui)
         *
         * Não aplicamos descontos de INSS/IRRF (conforme briefing).
         * O usuário é avisado no disclaimer.
         */

        (function() {
            'use strict';

            // =========== REFERÊNCIAS DOM ===========
            const form = document.getElementById('formDecimo');
            const resultadoEl = document.getElementById('resultado');
            const resultadoLinhasEl = document.getElementById('resultadoLinhas');
            const resultadoTotalEl = document.getElementById('resultadoTotal');
            const val1parcela = document.getElementById('val1parcela');
            const val2parcela = document.getElementById('val2parcela');
            const memoriaCalculoEl = document.getElementById('memoriaCalculo');

            // =========== HELPERS ===========

            /**
             * Formata um número em moeda brasileira.
             */
            function formatBRL(valor) {
                return valor.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }

            // =========== VALIDAÇÃO ===========

            function limparErros() {
                document.querySelectorAll('.form-field').forEach(f => f.classList.remove('has-error'));
            }

            function marcarErro(id) {
                const field = document.getElementById(id);
                if (field) field.classList.add('has-error');
            }

            function validar(salario, meses) {
                let ok = true;

                if (!salario || salario <= 0 || isNaN(salario)) {
                    marcarErro('field-salario');
                    ok = false;
                }
                if (!meses || meses < 1 || meses > 12 || isNaN(meses)) {
                    marcarErro('field-meses');
                    ok = false;
                }
                return ok;
            }

            // =========== CÁLCULO ===========

            /**
             * Calcula o 13º proporcional em centavos: multiplica antes de dividir
             * (salário × meses ÷ 12) e faz a 2ª parcela ser o que falta para o
             * total, para que 1ª + 2ª feche exatamente com o bruto exibido.
             */
            function calcularDecimo(salario, meses) {
                const valorBruto = Math.round((salario * meses / 12) * 100) / 100;
                const primeiraParcela = Math.round((valorBruto / 2) * 100) / 100;
                const segundaParcela = Math.round((valorBruto - primeiraParcela) * 100) / 100;
                return {
                    salario,
                    meses,
                    valorPorMes: salario / 12,
                    valorBruto,
                    primeiraParcela,
                    segundaParcela
                };
            }

            // =========== MEMÓRIA DE CÁLCULO ===========

            /**
             * Gera o passo a passo do cálculo com os valores do próprio usuário.
             */
            function gerarMemoriaCalculo(d) {
                const s = formatBRL(d.salario);
                const umAvos = formatBRL(d.valorPorMes);
                const qtdMeses = d.meses === 1 ? '1 mês' : `${d.meses} meses`;
                const itens = [];

                itens.push(
                    `<li><strong>Valor de cada mês de direito:</strong> o 13º divide o salário em 12 partes, ` +
                    `uma para cada mês do ano. Com salário de ${s}, cada mês vale <strong>${umAvos}</strong> ` +
                    `(${s} ÷ 12).</li>`
                );

                itens.push(
                    `<li><strong>Regra dos 15 dias:</strong> um mês só entra na conta se você trabalhou ` +
                    `<strong>15 dias ou mais</strong> nele, e aí conta como mês inteiro. Quem foi admitido em ` +
                    `10 de março trabalhou 22 dias naquele mês, e março conta; quem entrou em 20 de março ` +
                    `trabalhou só 12 dias, e março fica de fora. Os meses informados aqui já devem seguir essa regra.</li>`
                );

                itens.push(
                    `<li><strong>13º proporcional:</strong> com ${qtdMeses} de direito, o valor é ` +
                    `(${s} ÷ 12) × ${d.meses} = <strong>${formatBRL(d.valorBruto)}</strong>` +
                    (d.meses === 12 ? ', ou seja, um salário inteiro.' : '.') +
                    (d.meses < 12 ? ` Cada mês a mais que entrar pela regra dos 15 dias acrescenta ${umAvos}.` : '') +
                    `</li>`
                );

                itens.push(
                    `<li><strong>1ª parcela:</strong> metade do valor, <strong>${formatBRL(d.primeiraParcela)}</strong>, ` +
                    `paga entre fevereiro e 30 de novembro <strong>sem nenhum desconto</strong>.</li>`
                );

                itens.push(
                    `<li><strong>2ª parcela:</strong> a outra metade, <strong>${formatBRL(d.segundaParcela)}</strong> ` +
                    `brutos, paga até 20 de dezembro. É nela que a empresa faz as <strong>retenções legais de INSS ` +
                    `e Imposto de Renda</strong>, calculadas sobre o 13º inteiro (${formatBRL(d.valorBruto)}). ` +
                    `Por isso o valor que cai na conta em dezembro costuma ser menor que o da 1ª parcela.</li>`
                );

                return `
                    <h3 class="memoria-calculo__titulo">Memória de cálculo: como chegamos a esse valor</h3>
                    <ol class="memoria-calculo__lista">${itens.join('')}</ol>
                    <p class="memoria-calculo__total">Soma das parcelas: ${formatBRL(d.primeiraParcela)} + ` +
                    `${formatBRL(d.segundaParcela)} = <strong>${formatBRL(d.valorBruto)}</strong> (valor bruto).</p>
                    <p class="memoria-calculo__nota">Horas extras, comissões e adicionais recebidos com frequência
                    entram pela média do ano e aumentam o 13º (Lei 4.090/1962 e Lei 4.749/1965).</p>
                `;
            }

            // =========== RENDERIZAÇÃO ===========

            function criarLinha(label, desc, valor) {
                const div = document.createElement('div');
                div.className = 'result-line';
                div.innerHTML = `
                    <div class="result-line__label">
                        <strong>${label}</strong>
                        <small>${desc}</small>
                    </div>
                    <div class="result-line__value">${formatBRL(valor)}</div>
                `;
                return div;
            }

            function renderizarResultado(dados) {
                resultadoLinhasEl.innerHTML = '';

                // Linha: 13º proporcional bruto
                resultadoLinhasEl.appendChild(criarLinha(
                    '13º Salário Proporcional (Bruto)',
                    `(${formatBRL(dados.salario)} ÷ 12) × ${dados.meses} mês(es)`,
                    dados.valorBruto
                ));

                // Linha: valor diário para referência
                resultadoLinhasEl.appendChild(criarLinha(
                    'Valor por mês trabalhado',
                    'Referência: salário ÷ 12',
                    dados.valorPorMes
                ));

                // Atualiza os cards das parcelas
                val1parcela.textContent = formatBRL(dados.primeiraParcela);
                val2parcela.textContent = formatBRL(dados.segundaParcela);

                // Total
                resultadoTotalEl.textContent = formatBRL(dados.valorBruto);
                memoriaCalculoEl.innerHTML = gerarMemoriaCalculo(dados);

                resultadoEl.classList.add('is-visible');

                setTimeout(() => {
                    resultadoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
            }

            // =========== SUBMIT HANDLER ===========

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                limparErros();

                const salario = parseFloat(document.getElementById('salario').value);
                const meses = parseInt(document.getElementById('meses').value, 10);

                if (!validar(salario, meses)) {
                    return;
                }

                renderizarResultado(calcularDecimo(salario, meses));
            });

            // Limpa o estado de erro ao interagir
            form.addEventListener('input', function(e) {
                const field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });
            form.addEventListener('change', function(e) {
                const field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
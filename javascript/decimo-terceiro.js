/**
         * PodeCalcular - Calculadora de 13º Salário
         * -------------------------------------------
         * Regras aplicadas (valores BRUTOS, sem descontos):
         *   - 13º proporcional = (salário ÷ 12) × meses trabalhados
         *   - Meses: escolhidos no select OU contados a partir da data de admissão
         *     no ano atual até 31/12, pela regra dos 15 dias (contarMesesCLT,
         *     em javascript/clt-comum.js, a mesma usada na rescisão)
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
            const mesesSelect = document.getElementById('meses');
            const mesesAjudaEl = document.getElementById('mesesAjuda');
            const admissaoInput = document.getElementById('dataAdmissao');
            const admissaoErroEl = document.getElementById('admissaoErro');

            const { parseDate, contarMesesCLT } = window.PodeCalcularCLT;

            const NOMES_MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
                'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

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

            function formatData(data) {
                return data.toLocaleDateString('pt-BR');
            }

            // =========== MESES PELA DATA DE ADMISSÃO ===========

            /**
             * Conta os meses de direito do ano atual a partir da data de admissão,
             * considerando que o contrato segue até 31 de dezembro.
             * Retorna também o detalhe do mês de entrada, usado na memória de cálculo.
             */
            function mesesPelaAdmissao(admissao, ano) {
                const fimAno = new Date(ano, 11, 31);
                const admitidoAntes = admissao.getFullYear() < ano;
                const inicio = admitidoAntes ? new Date(ano, 0, 1) : admissao;
                const ultimoDiaMes = new Date(admissao.getFullYear(), admissao.getMonth() + 1, 0).getDate();
                const diasNoMesEntrada = ultimoDiaMes - admissao.getDate() + 1;

                return {
                    admissao,
                    ano,
                    admitidoAntes,
                    meses: contarMesesCLT(inicio, fimAno),
                    mesEntrada: admissao.getMonth(),
                    diaEntrada: admissao.getDate(),
                    ultimoDiaMes,
                    diasNoMesEntrada,
                    mesEntradaConta: diasNoMesEntrada >= 15
                };
            }

            /**
             * Com a data preenchida, o select fica travado e passa a mostrar
             * os meses calculados; sem a data, volta a ser escolha manual.
             */
            function sincronizarModo() {
                const usandoData = admissaoInput.value !== '';
                mesesSelect.disabled = usandoData;
                mesesAjudaEl.hidden = !usandoData;
                document.getElementById('field-meses').classList.remove('has-error');

                if (!usandoData) {
                    mesesSelect.value = '';
                    return;
                }
                const admissao = parseDate(admissaoInput.value);
                const ano = new Date().getFullYear();
                if (!isNaN(admissao) && admissao.getFullYear() <= ano) {
                    const m = mesesPelaAdmissao(admissao, ano).meses;
                    mesesSelect.value = m >= 1 ? String(m) : '';
                } else {
                    mesesSelect.value = '';
                }
            }

            admissaoInput.addEventListener('input', sincronizarModo);
            admissaoInput.addEventListener('change', sincronizarModo);

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
             * Explica a regra dos 15 dias: genérica quando os meses vieram do select,
             * aplicada ao mês de entrada quando a pessoa informou a data.
             */
            function explicarRegra15(p) {
                const regra = 'um mês só entra na conta se você trabalhou <strong>15 dias ou mais</strong> nele, ' +
                    'e aí conta como mês inteiro.';

                if (!p) {
                    return regra + ' Quem foi admitido em 10 de março trabalhou 22 dias naquele mês, e março conta; ' +
                        'quem entrou em 20 de março trabalhou só 12 dias, e março fica de fora. Os meses informados ' +
                        'aqui já devem seguir essa regra. Se preferir, informe a data de admissão e fazemos essa conta.';
                }

                const qtd = p.meses === 1 ? '1 mês' : `${p.meses} meses`;

                if (p.admitidoAntes) {
                    return regra + ` Como você foi admitido em ${formatData(p.admissao)}, antes de ${p.ano}, ` +
                        `trabalhou todos os meses do ano e tem direito a <strong>12 meses</strong>.`;
                }

                const nomeMes = NOMES_MESES[p.mesEntrada];
                const dias = p.diasNoMesEntrada === 1 ? '1 dia' : `${p.diasNoMesEntrada} dias`;
                const periodo = p.diaEntrada === p.ultimoDiaMes
                    ? `só o dia ${p.diaEntrada}`
                    : `do dia ${p.diaEntrada} ao dia ${p.ultimoDiaMes}`;
                let texto = regra + ` Você foi admitido em ${formatData(p.admissao)}, então trabalhou ` +
                    `<strong>${dias}</strong> em ${nomeMes} (${periodo}). `;

                if (p.mesEntradaConta) {
                    const seguintes = 11 - p.mesEntrada;
                    texto += `Como são 15 dias ou mais, ${nomeMes} <strong>conta como mês inteiro</strong>` +
                        (seguintes > 0
                            ? `. Somando os ${seguintes === 1 ? 'mês seguinte' : seguintes + ' meses seguintes'} até dezembro, `
                            : ', ') +
                        `${p.meses === 1 ? 'é' : 'são'} <strong>${qtd}</strong> de direito em ${p.ano}.`;
                } else {
                    texto += `Como são menos de 15 dias, ${nomeMes} <strong>não entra na conta</strong>` +
                        (p.meses > 0
                            ? `. A contagem começa em ${NOMES_MESES[p.mesEntrada + 1]} e vai até dezembro: ` +
                              `<strong>${qtd}</strong> de direito em ${p.ano}.`
                            : '.');
                }
                return texto + ' A conta considera que você continua na empresa até 31 de dezembro.';
            }

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

                itens.push(`<li><strong>Regra dos 15 dias:</strong> ${explicarRegra15(d.porData)}</li>`);

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
                let meses = parseInt(mesesSelect.value, 10);
                let porData = null;

                // Modo data: os meses vêm da regra dos 15 dias e o select é ignorado
                if (admissaoInput.value !== '') {
                    const admissao = parseDate(admissaoInput.value);
                    const ano = new Date().getFullYear();
                    let erro = '';

                    if (isNaN(admissao)) {
                        erro = 'Informe uma data válida.';
                    } else if (admissao.getFullYear() > ano) {
                        erro = `A data deve ser de ${ano} ou anterior.`;
                    } else {
                        porData = mesesPelaAdmissao(admissao, ano);
                        meses = porData.meses;
                        if (meses < 1) {
                            erro = 'Com admissão nessa data não há mês com 15 dias trabalhados neste ano, ' +
                                'então ainda não há 13º proporcional.';
                        }
                    }

                    if (erro) {
                        admissaoErroEl.textContent = erro;
                        marcarErro('field-admissao');
                        if (isNaN(salario) || salario <= 0) marcarErro('field-salario');
                        return;
                    }
                }

                if (!validar(salario, meses)) {
                    return;
                }

                const dados = calcularDecimo(salario, meses);
                dados.porData = porData;
                renderizarResultado(dados);
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
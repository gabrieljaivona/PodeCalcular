/**
         * PodeCalcular - Calculadora de Rescisão CLT
         * --------------------------------------------
         * Regras aplicadas (de forma simplificada):
         *  - Saldo de salário: salário/30 × dias trabalhados no último mês
         *  - Aviso prévio (Lei 12.506/2011): indenizado pelo empregador = salário/30 × (30 + 3 por ano
         *    completo, máx. 90 dias); não cumprido pelo trabalhador = desconto de 30 dias; trabalhado = sem parcela
         *  - Aviso indenizado projeta o contrato (CLT art. 487, §1º) para 13º e férias proporcionais
         *  - 13º proporcional: salário/12 × meses no ano corrente (>= 15 dias = mês cheio)
         *  - Férias proporcionais + 1/3: salário/12 × meses no período aquisitivo atual
         *  - Multa 40% FGTS: (salário × 8% × meses + 8% do aviso indenizado) × 40% — apenas dispensa sem justa causa
         *  - Saldo do FGTS informado pelo usuário (opcional) substitui a estimativa na multa e no limite de saque
         *  - Acordo (CLT art. 484-A): aviso indenizado pela metade, multa de 20% do FGTS, saque de até 80%
         *    e sem seguro-desemprego. A projeção do contrato usa apenas os dias de aviso efetivamente pagos.
         *
         * Descontos de INSS/IRRF NÃO são aplicados (conforme briefing).
         */

        (function() {
            'use strict';

            // =========== REFERÊNCIAS DOM ===========
            const form = document.getElementById('formRescisao');
            const resultadoEl = document.getElementById('resultado');
            const resultadoLinhasEl = document.getElementById('resultadoLinhas');
            const resultadoTotalEl = document.getElementById('resultadoTotal');
            const resultadoFgtsEl = document.getElementById('resultadoFgts');
            const resultadoFgtsDescEl = document.getElementById('resultadoFgtsDesc');
            const memoriaCalculoEl = document.getElementById('memoriaCalculo');
            const motivoEl = document.getElementById('motivo');
            const avisoEl = document.getElementById('aviso');

            // =========== HELPERS ===========

            /**
             * Formata um número em moeda brasileira (R$ 1.234,56).
             */
            function formatBRL(valor) {
                return valor.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }

            /**
             * Recebe uma string "YYYY-MM-DD" e devolve um objeto Date no fuso local.
             * Evita o bug clássico de `new Date('2024-01-01')` vir como UTC.
             */
            function parseDate(str) {
                const [ano, mes, dia] = str.split('-').map(Number);
                return new Date(ano, mes - 1, dia);
            }

            /**
             * Formata uma data como dd/mm/aaaa.
             */
            function formatData(data) {
                return data.toLocaleDateString('pt-BR');
            }

            /**
             * Soma uma quantidade de dias corridos a uma data.
             */
            function somarDias(data, dias) {
                return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);
            }

            /**
             * Anos completos entre duas datas (aniversário de admissão já atingido).
             */
            function anosCompletos(inicio, fim) {
                let anos = fim.getFullYear() - inicio.getFullYear();
                const aniversario = new Date(fim.getFullYear(), inicio.getMonth(), inicio.getDate());
                if (fim < aniversario) anos--;
                return Math.max(anos, 0);
            }

            /**
             * Conta os meses para fins de cálculo trabalhista.
             * Regra CLT: fração >= 15 dias em um mês conta como mês integral.
             *
             * @param {Date} inicio - data inicial (inclusive)
             * @param {Date} fim    - data final (inclusive)
             * @returns {number} - total de meses computáveis
             */
            function contarMesesCLT(inicio, fim) {
                if (inicio > fim) return 0;

                let meses = 0;
                // Percorre mês a mês entre inicio e fim
                let cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
                const fimCursor = new Date(fim.getFullYear(), fim.getMonth(), 1);

                while (cursor <= fimCursor) {
                    // Intervalo real trabalhado dentro deste mês específico
                    const primeiroDiaMes = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
                    const ultimoDiaMes  = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

                    const inicioEfetivo = inicio > primeiroDiaMes ? inicio : primeiroDiaMes;
                    const fimEfetivo    = fim < ultimoDiaMes ? fim : ultimoDiaMes;

                    const umDia = 1000 * 60 * 60 * 24;
                    const diasTrabalhados = Math.floor((fimEfetivo - inicioEfetivo) / umDia) + 1;

                    if (diasTrabalhados >= 15) {
                        meses++;
                    }

                    // Avança para o mês seguinte
                    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
                }

                return meses;
            }

            // =========== REGRAS DE CÁLCULO CLT ===========

            /**
             * Saldo de salário: proporcional aos dias trabalhados no mês da rescisão.
             * Fórmula: (salário ÷ 30) × dia da demissão
             */
            function calcSaldoSalario(salario, dataDemissao) {
                const dia = dataDemissao.getDate();
                return (salario / 30) * dia;
            }

            /**
             * Dias de aviso prévio proporcional (Lei 12.506/2011):
             * 30 dias + 3 por ano completo de serviço, limitado a 90 dias.
             */
            function calcDiasAvisoProporcional(anos) {
                return Math.min(30 + 3 * anos, 90);
            }

            /**
             * 13º proporcional: meses trabalhados no ano corrente da rescisão.
             * Se o trabalhador foi admitido no mesmo ano, conta-se desde a admissão.
             */
            function calc13Proporcional(salario, dataAdmissao, dataDemissao, dataFim) {
                // Conta a partir de janeiro do ano da saída até o fim do contrato
                // (dataFim inclui a projeção do aviso indenizado, se houver)
                const inicioAno = new Date(dataDemissao.getFullYear(), 0, 1);
                const inicio = dataAdmissao > inicioAno ? dataAdmissao : inicioAno;
                const meses = contarMesesCLT(inicio, dataFim);
                return (salario / 12) * meses;
            }

            /**
             * Férias proporcionais + 1/3 constitucional.
             * Simplificação: assume-se que férias de períodos encerrados antes da saída
             * já foram usufruídas. Conta os meses do período atual (1 a 12) e, com aviso
             * indenizado, os meses da projeção (que podem completar um novo período).
             */
            function calcMesesFerias(dataAdmissao, dataDemissao, dataFim) {
                const mesesReais = contarMesesCLT(dataAdmissao, dataDemissao);
                const mesesProjetados = contarMesesCLT(dataAdmissao, dataFim);
                const periodosUsufruidos = mesesReais > 0 ? Math.floor((mesesReais - 1) / 12) : 0;
                return mesesProjetados - 12 * periodosUsufruidos;
            }

            function calcFeriasProporcionais(salario, mesesAquisitivo) {
                const valorBase = (salario / 12) * mesesAquisitivo;
                const umTerco = valorBase / 3;
                return valorBase + umTerco;
            }

            /**
             * FGTS estimado do contrato e multa rescisória (40% na dispensa sem justa causa,
             * 20% no acordo). Aproximação: FGTS ≈ 8% do salário bruto por mês trabalhado.
             */
            function calcFGTSEstimado(salario, dataAdmissao, dataDemissao, avisoIndenizado) {
                const totalMeses = contarMesesCLT(dataAdmissao, dataDemissao);
                // O aviso prévio indenizado também recebe depósito de 8% (Súmula 305 do TST)
                return salario * 0.08 * totalMeses + avisoIndenizado * 0.08;
            }

            /**
             * Converte o campo opcional de saldo do FGTS: null quando em branco.
             */
            function lerSaldoFgts(str) {
                const limpo = (str || '').trim();
                return limpo === '' ? null : parseFloat(limpo);
            }

            /**
             * Formata um número com vírgula decimal (ex.: 16,5).
             */
            function formatNum(n) {
                return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
            }

            /**
             * Habilita apenas as opções de aviso compatíveis com o motivo.
             */
            function sincronizarAviso() {
                const motivo = motivoEl.value;
                avisoEl.querySelector('option[value="indenizado-empregador"]').disabled =
                    !(motivo === 'sem-justa-causa' || motivo === 'acordo');
                avisoEl.querySelector('option[value="indenizado-trabalhador"]').disabled = motivo !== 'pedido-demissao';
                if (avisoEl.selectedOptions[0] && avisoEl.selectedOptions[0].disabled) {
                    avisoEl.value = 'trabalhado';
                }
            }

            // =========== VALIDAÇÃO DO FORM ===========

            function limparErros() {
                document.querySelectorAll('.form-field').forEach(f => f.classList.remove('has-error'));
            }

            function marcarErro(id) {
                const field = document.getElementById(id);
                if (field) field.classList.add('has-error');
            }

            function validar(salario, admissao, demissao, motivo, aviso, saldoFgts) {
                let ok = true;

                if (!salario || salario <= 0 || isNaN(salario)) {
                    marcarErro('field-salario');
                    ok = false;
                }
                if (!admissao) {
                    marcarErro('field-admissao');
                    ok = false;
                }
                if (!demissao) {
                    marcarErro('field-demissao');
                    ok = false;
                }
                if (admissao && demissao) {
                    const dAdm = parseDate(admissao);
                    const dDem = parseDate(demissao);
                    if (dDem <= dAdm) {
                        marcarErro('field-demissao');
                        ok = false;
                    }
                }
                if ((aviso === 'indenizado-empregador' && motivo !== 'sem-justa-causa' && motivo !== 'acordo') ||
                    (aviso === 'indenizado-trabalhador' && motivo !== 'pedido-demissao')) {
                    marcarErro('field-aviso');
                    ok = false;
                }
                if (saldoFgts !== null && (isNaN(saldoFgts) || saldoFgts < 0)) {
                    marcarErro('field-fgts');
                    ok = false;
                }
                return ok;
            }

            // =========== RENDERIZAÇÃO DO RESULTADO ===========

            function criarLinha(label, desc, valor) {
                const div = document.createElement('div');
                div.className = valor < 0 ? 'result-line result-line--desconto' : 'result-line';
                div.innerHTML = `
                    <div class="result-line__label">
                        <strong>${label}</strong>
                        <small>${desc}</small>
                    </div>
                    <div class="result-line__value">${formatBRL(valor)}</div>
                `;
                return div;
            }

            /**
             * Gera o passo a passo do cálculo com os valores do próprio usuário.
             */
            function gerarMemoriaCalculo(d) {
                const s = formatBRL(d.salario);
                const qtd = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
                const feriasBase = (d.salario / 12) * d.mesesFerias;
                const itens = [];

                itens.push(
                    `<li><strong>Saldo de salário:</strong> como o seu salário é ${s} e você trabalhou ` +
                    `${qtd(d.diasTrabalhados, 'dia', 'dias')} no mês da saída, o saldo é de ` +
                    `<strong>${formatBRL(d.saldoSalario)}</strong> (${s} dividido por 30, multiplicado por ${d.diasTrabalhados}).</li>`
                );

                const tempoCasa = d.anosCompletos === 0
                    ? 'menos de 1 ano'
                    : qtd(d.anosCompletos, 'ano completo', 'anos completos');
                if (d.aviso === 'indenizado-empregador' && d.motivo === 'acordo') {
                    itens.push(
                        `<li><strong>Aviso prévio indenizado (acordo):</strong> com ${tempoCasa} de empresa, o seu aviso ` +
                        `seria de ${d.diasAviso} dias (30 dias + 3 por ano completo, até 90). No acordo, a empresa paga ` +
                        `metade: ${formatNum(d.diasAvisoPagos)} dias, ou <strong>${formatBRL(d.avisoPrevio)}</strong> ` +
                        `(${s} dividido por 30, multiplicado por ${formatNum(d.diasAvisoPagos)}).</li>`
                    );
                    itens.push(
                        `<li><strong>Projeção do contrato no acordo:</strong> como o art. 484-A da CLT reduz o aviso ` +
                        `indenizado à metade, a projeção do contrato foi feita considerando apenas os ` +
                        (d.diasProjecao === d.diasAvisoPagos
                            ? `${d.diasProjecao} dias de aviso efetivamente pagos`
                            : `${d.diasProjecao} dias inteiros dos ${formatNum(d.diasAvisoPagos)} dias de aviso pagos`) +
                        `, e não os ${d.diasAviso} dias do aviso integral. ` +
                        `O contrato vai até ${formatData(d.dataProjetada)}, data usada no 13º e nas férias abaixo. ` +
                        `Esse é o critério adotado por esta calculadora; há quem projete o aviso inteiro, então confirme com o RH.</li>`
                    );
                } else if (d.aviso === 'indenizado-empregador') {
                    itens.push(
                        `<li><strong>Aviso prévio indenizado:</strong> com ${tempoCasa} de empresa, o seu aviso é de ` +
                        `${d.diasAviso} dias (30 dias + 3 por ano completo, até 90). Como a empresa dispensou o cumprimento, ` +
                        `ela paga <strong>${formatBRL(d.avisoPrevio)}</strong> (${s} dividido por 30, multiplicado por ${d.diasAviso}). ` +
                        `Esse período conta como tempo de serviço: o contrato é projetado até ${formatData(d.dataProjetada)}, ` +
                        `o que entra no cálculo do 13º e das férias abaixo.</li>`
                    );
                } else if (d.aviso === 'indenizado-trabalhador') {
                    itens.push(
                        `<li><strong>Aviso prévio não cumprido:</strong> como você pediu demissão e não cumpriu o aviso, ` +
                        `a empresa pode descontar 30 dias de salário: <strong>${formatBRL(d.avisoPrevio)}</strong> ` +
                        `(${s} dividido por 30, multiplicado por 30). Para quem pede demissão o aviso é sempre de 30 dias; ` +
                        `o acréscimo de 3 dias por ano vale apenas quando a empresa demite.</li>`
                    );
                } else {
                    let extra = '';
                    if (d.motivo === 'acordo') {
                        extra = ' No acordo, só o aviso indenizado cai pela metade: o aviso trabalhado é cumprido normalmente.';
                    } else if (d.motivo === 'sem-justa-causa' && d.diasAviso > 30) {
                        extra = ` Com ${tempoCasa} de empresa, o seu aviso total é de ${d.diasAviso} dias. ` +
                            `Se você trabalhou só 30, os ${d.diasAviso - 30} dias restantes costumam ser pagos à parte: confirme com o RH.`;
                    }
                    itens.push(
                        `<li><strong>Aviso prévio trabalhado:</strong> você cumpriu o aviso trabalhando, e esses dias já são ` +
                        `pagos como salário normal (incluídos no saldo de salário). Não há parcela extra.${extra}</li>`
                    );
                }

                const anoSaida = d.dataDemissao.getFullYear();
                let contexto13;
                if (d.projetado && d.mesesNoAno > 12) {
                    contexto13 = `a projeção do aviso passa da virada do ano, somando 12 meses em ${anoSaida} ` +
                        `e ${qtd(d.mesesNoAno - 12, 'mês', 'meses')} em ${anoSaida + 1} (${d.mesesNoAno} no total)`;
                } else if (d.projetado) {
                    contexto13 = `contando a projeção do aviso, você tem ${qtd(d.mesesNoAno, 'mês', 'meses')} em ${anoSaida}`;
                } else {
                    contexto13 = `você trabalhou ${qtd(d.mesesNoAno, 'mês', 'meses')} neste ano`;
                }
                itens.push(
                    `<li><strong>13º proporcional:</strong> como o seu salário é ${s} e ${contexto13}, o seu 13º proporcional é de ` +
                    `<strong>${formatBRL(d.decimoTerceiro)}</strong> (${s} dividido por 12, multiplicado por ${d.mesesNoAno}).</li>`
                );

                itens.push(
                    `<li><strong>Férias proporcionais:</strong> você tem ${qtd(d.mesesFerias, 'mês', 'meses')} no período ` +
                    `aquisitivo atual${d.projetado ? ' (já com a projeção do aviso)' : ''}. As férias somam ${formatBRL(feriasBase)} (${s} dividido por 12, multiplicado por ` +
                    `${d.mesesFerias}), mais 1/3 constitucional de ${formatBRL(feriasBase / 3)}, totalizando ` +
                    `<strong>${formatBRL(d.ferias)}</strong>.</li>`
                );

                if (d.percentualMulta > 0) {
                    const pct = d.motivo === 'acordo' ? '20%' : '40%';
                    const metade = d.motivo === 'acordo' ? ', metade da multa da dispensa sem justa causa' : '';
                    let base;
                    if (d.fgtsInformado) {
                        base = `Com base no saldo informado de ${formatBRL(d.fgtsBase)}, `;
                    } else {
                        const avisoFgts = d.avisoPrevio > 0 ? ', mais 8% sobre o aviso indenizado' : '';
                        base = `Como o saldo do FGTS não foi informado, fizemos um cálculo aproximado: em ` +
                            `${qtd(d.totalMesesContrato, 'mês', 'meses')} de contrato, o FGTS depositado é estimado em ` +
                            `${formatBRL(d.fgtsBase)} (8% de ${s} por mês${avisoFgts}). Com essa estimativa, `;
                    }
                    itens.push(
                        `<li><strong>Multa do FGTS:</strong> ${base}a multa de ${pct} é de ` +
                        `<strong>${formatBRL(d.multaFgts)}</strong>${metade}. ` +
                        `Ela é depositada na sua conta do FGTS, e não paga no termo de rescisão.` +
                        `${d.fgtsInformado ? '' : ' Para o valor exato, informe o saldo que aparece no app do FGTS.'}</li>`
                    );
                    if (d.motivo === 'acordo') {
                        const totalConta = d.fgtsBase + d.multaFgts;
                        itens.push(
                            `<li><strong>Saque do FGTS e seguro-desemprego:</strong> no acordo, você pode sacar no máximo ` +
                            `<strong>80% do saldo do FGTS</strong>. ${d.fgtsInformado ? 'Com o saldo informado' : 'Pela estimativa'} ` +
                            `de ${formatBRL(d.fgtsBase)} mais a multa de ${formatBRL(d.multaFgts)}, a conta fica com ` +
                            `${formatBRL(totalConta)}, e o limite de saque é de <strong>${formatBRL(totalConta * 0.8)}</strong>. ` +
                            `Os outros ${formatBRL(totalConta * 0.2)} ficam na conta. Essa modalidade ` +
                            `<strong>não dá direito ao seguro-desemprego</strong>.</li>`
                        );
                    }
                } else {
                    itens.push(
                        `<li><strong>Multa do FGTS:</strong> no pedido de demissão não há multa de 40% ` +
                        `nem saque do FGTS.</li>`
                    );
                }

                const valores = [d.saldoSalario, d.avisoPrevio, d.decimoTerceiro, d.ferias]
                    .filter(v => v !== 0);
                const parcelas = valores
                    .map((v, i) => (i === 0 ? '' : (v < 0 ? ' − ' : ' + ')) + formatBRL(Math.abs(v)))
                    .join('');

                return `
                    <h3 class="memoria-calculo__titulo">Memória de cálculo: como chegamos a esse valor</h3>
                    <ol class="memoria-calculo__lista">${itens.join('')}</ol>
                    <p class="memoria-calculo__total">Soma das verbas rescisórias (TRCT): ${parcelas} = <strong>${formatBRL(d.totalTrct)}</strong>.</p>
                    <p class="memoria-calculo__total">Multa depositada no FGTS: ${d.percentualMulta > 0
                        ? `<strong>${formatBRL(d.multaFgts)}</strong>${d.fgtsInformado ? '' : ' (estimativa)'}.`
                        : 'não há multa no pedido de demissão.'}</p>
                    <p class="memoria-calculo__nota">Meses com 15 dias ou mais de trabalho contam como mês inteiro.
                    Este cálculo considera que férias de períodos anteriores já foram tiradas.</p>
                `;
            }

            function renderizarResultado(dados) {
                resultadoLinhasEl.innerHTML = ''; // limpa anterior

                resultadoLinhasEl.appendChild(criarLinha(
                    'Saldo de Salário',
                    `${dados.diasTrabalhados} dia(s) trabalhado(s) no último mês`,
                    dados.saldoSalario
                ));

                if (dados.avisoPrevio > 0) {
                    resultadoLinhasEl.appendChild(criarLinha(
                        dados.motivo === 'acordo' ? 'Aviso Prévio Indenizado (50%)' : 'Aviso Prévio Indenizado',
                        dados.motivo === 'acordo'
                            ? `${formatNum(dados.diasAvisoPagos)} de ${dados.diasAviso} dias (metade, art. 484-A)`
                            : `${dados.diasAviso} dias (30 + 3 por ano completo)`,
                        dados.avisoPrevio
                    ));
                } else if (dados.avisoPrevio < 0) {
                    resultadoLinhasEl.appendChild(criarLinha(
                        'Desconto do Aviso Prévio',
                        '30 dias não cumpridos pelo trabalhador',
                        dados.avisoPrevio
                    ));
                }

                resultadoLinhasEl.appendChild(criarLinha(
                    '13º Salário Proporcional',
                    `${dados.mesesNoAno} mês(es) no ano${dados.projetado ? ', com projeção do aviso' : ''}`,
                    dados.decimoTerceiro
                ));

                resultadoLinhasEl.appendChild(criarLinha(
                    'Férias Proporcionais + 1/3',
                    `${dados.mesesFerias} mês(es) no período aquisitivo atual${dados.projetado ? ', com projeção do aviso' : ''}`,
                    dados.ferias
                ));

                resultadoTotalEl.textContent = formatBRL(dados.totalTrct);
                resultadoFgtsEl.textContent = formatBRL(dados.multaFgts);
                if (dados.percentualMulta > 0) {
                    const pct = dados.motivo === 'acordo' ? '20%' : '40%';
                    resultadoFgtsDescEl.textContent = dados.fgtsInformado
                        ? `Multa de ${pct} sobre o saldo informado de ${formatBRL(dados.fgtsBase)}`
                        : `Multa de ${pct}, estimada sobre depósitos de 8% ao mês`;
                } else {
                    resultadoFgtsDescEl.textContent = 'Sem multa no pedido de demissão';
                }
                memoriaCalculoEl.innerHTML = gerarMemoriaCalculo(dados);
                resultadoEl.classList.add('is-visible');

                // Scroll suave até o resultado
                setTimeout(() => {
                    resultadoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
            }

            // =========== SUBMIT HANDLER ===========

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                limparErros();

                const salarioStr = document.getElementById('salario').value;
                const salario = parseFloat(salarioStr);
                const admissaoStr = document.getElementById('dataAdmissao').value;
                const demissaoStr = document.getElementById('dataDemissao').value;
                const motivo = motivoEl.value;
                const aviso = avisoEl.value;
                const saldoFgts = lerSaldoFgts(document.getElementById('saldoFgts').value);

                if (!validar(salario, admissaoStr, demissaoStr, motivo, aviso, saldoFgts)) {
                    return;
                }

                const dataAdmissao = parseDate(admissaoStr);
                const dataDemissao = parseDate(demissaoStr);

                // --- Aviso prévio ---
                const anos = anosCompletos(dataAdmissao, dataDemissao);
                const diasAviso = (motivo === 'sem-justa-causa' || motivo === 'acordo')
                    ? calcDiasAvisoProporcional(anos)
                    : 30;
                // No acordo (art. 484-A, I, "a"), o aviso indenizado é pago pela metade
                const diasAvisoPagos = motivo === 'acordo' ? diasAviso / 2 : diasAviso;
                let avisoPrevio = 0;
                if (aviso === 'indenizado-empregador') {
                    avisoPrevio = (salario / 30) * diasAvisoPagos;
                } else if (aviso === 'indenizado-trabalhador') {
                    avisoPrevio = -(salario / 30) * 30;
                }

                // Aviso indenizado pelo empregador integra o tempo de serviço (CLT, art. 487, §1º).
                // No acordo, projeta-se apenas a metade efetivamente paga (dias inteiros).
                const projetado = aviso === 'indenizado-empregador';
                const diasProjecao = projetado ? Math.floor(diasAvisoPagos) : 0;
                const dataProjetada = projetado ? somarDias(dataDemissao, diasProjecao) : dataDemissao;

                // --- Cálculos ---
                const saldoSalario = calcSaldoSalario(salario, dataDemissao);
                const mesesFerias = calcMesesFerias(dataAdmissao, dataDemissao, dataProjetada);
                const decimoTerceiro = calc13Proporcional(salario, dataAdmissao, dataDemissao, dataProjetada);
                const ferias = calcFeriasProporcionais(salario, mesesFerias);

                // Multa do FGTS: 40% na dispensa sem justa causa, 20% no acordo, nenhuma no pedido de demissão
                const percentualMulta = motivo === 'sem-justa-causa' ? 0.40 : (motivo === 'acordo' ? 0.20 : 0);
                // Base da multa: saldo informado pelo usuário ou, em branco, a estimativa de 8% ao mês
                const fgtsInformado = saldoFgts !== null;
                const fgtsBase = fgtsInformado
                    ? saldoFgts
                    : calcFGTSEstimado(salario, dataAdmissao, dataDemissao, Math.max(avisoPrevio, 0));
                const multaFgts = fgtsBase * percentualMulta;

                // Verbas pagas no termo de rescisão (TRCT); a multa vai para a conta do FGTS
                const totalTrct = saldoSalario + avisoPrevio + decimoTerceiro + ferias;

                // --- Metadados para exibir nas linhas ---
                const inicioAno = new Date(dataDemissao.getFullYear(), 0, 1);
                const inicioContagem = dataAdmissao > inicioAno ? dataAdmissao : inicioAno;
                const mesesNoAno = contarMesesCLT(inicioContagem, dataProjetada);
                const totalMesesContrato = contarMesesCLT(dataAdmissao, dataDemissao);

                renderizarResultado({
                    salario,
                    motivo,
                    aviso,
                    anosCompletos: anos,
                    diasAviso,
                    diasAvisoPagos,
                    percentualMulta,
                    fgtsInformado,
                    fgtsBase,
                    diasProjecao,
                    avisoPrevio,
                    projetado,
                    dataProjetada,
                    dataDemissao,
                    totalMesesContrato,
                    diasTrabalhados: dataDemissao.getDate(),
                    mesesNoAno,
                    mesesFerias,
                    saldoSalario,
                    decimoTerceiro,
                    ferias,
                    multaFgts,
                    totalTrct
                });
            });

            // Mantém as opções de aviso coerentes com o motivo escolhido
            motivoEl.addEventListener('change', sincronizarAviso);
            sincronizarAviso();

            // Limpa o estado de erro conforme o usuário corrige os campos
            form.addEventListener('input', function(e) {
                const field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
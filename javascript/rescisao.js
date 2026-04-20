/**
         * PodeCalcular - Calculadora de Rescisão CLT
         * --------------------------------------------
         * Regras aplicadas (de forma simplificada):
         *  - Saldo de salário: salário/30 × dias trabalhados no último mês
         *  - 13º proporcional: salário/12 × meses no ano corrente (>= 15 dias = mês cheio)
         *  - Férias proporcionais + 1/3: salário/12 × meses no período aquisitivo atual
         *  - Multa 40% FGTS: (salário × 8% × meses totais) × 40% — apenas dispensa sem justa causa
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
             * 13º proporcional: meses trabalhados no ano corrente da rescisão.
             * Se o trabalhador foi admitido no mesmo ano, conta-se desde a admissão.
             */
            function calc13Proporcional(salario, dataAdmissao, dataDemissao) {
                const inicioAno = new Date(dataDemissao.getFullYear(), 0, 1);
                const inicio = dataAdmissao > inicioAno ? dataAdmissao : inicioAno;
                const meses = contarMesesCLT(inicio, dataDemissao);
                return (salario / 12) * meses;
            }

            /**
             * Férias proporcionais + 1/3 constitucional.
             * Simplificação: considera apenas o período aquisitivo atual (0 a 11 meses).
             * Assume-se que férias de períodos anteriores já foram usufruídas.
             */
            function calcFeriasProporcionais(salario, dataAdmissao, dataDemissao) {
                const totalMeses = contarMesesCLT(dataAdmissao, dataDemissao);
                // Meses no período aquisitivo atual (o resto após ciclos completos de 12)
                let mesesAquisitivo = totalMeses % 12;

                // Se o total de meses é múltiplo exato de 12 e > 0, ele tem 12 meses
                // no último período (férias integrais proporcionais, não vencidas ainda).
                if (totalMeses > 0 && mesesAquisitivo === 0) {
                    mesesAquisitivo = 12;
                }

                const valorBase = (salario / 12) * mesesAquisitivo;
                const umTerco = valorBase / 3;
                return valorBase + umTerco;
            }

            /**
             * Multa de 40% do FGTS sobre todo o contrato.
             * Aproximação: FGTS ≈ 8% do salário bruto por mês trabalhado.
             */
            function calcMultaFGTS(salario, dataAdmissao, dataDemissao) {
                const totalMeses = contarMesesCLT(dataAdmissao, dataDemissao);
                const fgtsEstimado = salario * 0.08 * totalMeses;
                return fgtsEstimado * 0.40;
            }

            // =========== VALIDAÇÃO DO FORM ===========

            function limparErros() {
                document.querySelectorAll('.form-field').forEach(f => f.classList.remove('has-error'));
            }

            function marcarErro(id) {
                const field = document.getElementById(id);
                if (field) field.classList.add('has-error');
            }

            function validar(salario, admissao, demissao) {
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
                return ok;
            }

            // =========== RENDERIZAÇÃO DO RESULTADO ===========

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
                resultadoLinhasEl.innerHTML = ''; // limpa anterior

                resultadoLinhasEl.appendChild(criarLinha(
                    'Saldo de Salário',
                    `${dados.diasTrabalhados} dia(s) trabalhado(s) no último mês`,
                    dados.saldoSalario
                ));

                resultadoLinhasEl.appendChild(criarLinha(
                    '13º Salário Proporcional',
                    `${dados.mesesNoAno} mês(es) trabalhado(s) no ano`,
                    dados.decimoTerceiro
                ));

                resultadoLinhasEl.appendChild(criarLinha(
                    'Férias Proporcionais + 1/3',
                    `${dados.mesesFerias} mês(es) no período aquisitivo atual`,
                    dados.ferias
                ));

                if (dados.multaFgts > 0) {
                    resultadoLinhasEl.appendChild(criarLinha(
                        'Multa de 40% do FGTS',
                        'Estimativa sobre 8% de FGTS ao mês',
                        dados.multaFgts
                    ));
                }

                resultadoTotalEl.textContent = formatBRL(dados.total);
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
                const motivo = document.getElementById('motivo').value;

                if (!validar(salario, admissaoStr, demissaoStr)) {
                    return;
                }

                const dataAdmissao = parseDate(admissaoStr);
                const dataDemissao = parseDate(demissaoStr);

                // --- Cálculos ---
                const saldoSalario = calcSaldoSalario(salario, dataDemissao);
                const decimoTerceiro = calc13Proporcional(salario, dataAdmissao, dataDemissao);
                const ferias = calcFeriasProporcionais(salario, dataAdmissao, dataDemissao);

                // Multa 40% FGTS apenas para dispensa sem justa causa
                const multaFgts = (motivo === 'sem-justa-causa')
                    ? calcMultaFGTS(salario, dataAdmissao, dataDemissao)
                    : 0;

                const total = saldoSalario + decimoTerceiro + ferias + multaFgts;

                // --- Metadados para exibir nas linhas ---
                const inicioAno = new Date(dataDemissao.getFullYear(), 0, 1);
                const inicioContagem = dataAdmissao > inicioAno ? dataAdmissao : inicioAno;
                const mesesNoAno = contarMesesCLT(inicioContagem, dataDemissao);
                const totalMesesContrato = contarMesesCLT(dataAdmissao, dataDemissao);
                let mesesFerias = totalMesesContrato % 12;
                if (totalMesesContrato > 0 && mesesFerias === 0) mesesFerias = 12;

                renderizarResultado({
                    diasTrabalhados: dataDemissao.getDate(),
                    mesesNoAno,
                    mesesFerias,
                    saldoSalario,
                    decimoTerceiro,
                    ferias,
                    multaFgts,
                    total
                });
            });

            // Limpa o estado de erro conforme o usuário corrige os campos
            form.addEventListener('input', function(e) {
                const field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
/**
         * PodeCalcular - Calculadora de Hora Extra e Adicional Noturno
         * --------------------------------------------------------------
         * Regras aplicadas (valores BRUTOS, sem descontos):
         *
         *   Hora normal       = salário ÷ jornada mensal
         *   HE 50%            = hora normal × 1,50 × qtd horas
         *   HE 100%           = hora normal × 2,00 × qtd horas
         *   Adicional Noturno = hora normal × 0,20 × qtd horas noturnas
         *
         * Simplificações declaradas no disclaimer:
         *   - Não inclui DSR sobre horas extras
         *   - Não aplica a hora noturna reduzida (52min30s)
         *   - Não aplica descontos de INSS/IRRF
         *
         * Cada linha é arredondada a centavos e o total é a soma das linhas
         * exibidas, como num holerite.
         */

        (function() {
            'use strict';

            // =========== REFERÊNCIAS DOM ===========
            const form = document.getElementById('formHoraExtra');
            const resultadoEl = document.getElementById('resultado');
            const resultadoLinhasEl = document.getElementById('resultadoLinhas');
            const resultadoTotalEl = document.getElementById('resultadoTotal');
            const valHoraNormal = document.getElementById('valHoraNormal');
            const horaFormula = document.getElementById('horaFormula');
            const memoriaCalculoEl = document.getElementById('memoriaCalculo');

            // =========== HELPERS ===========

            function formatBRL(valor) {
                return valor.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }

            function centavos(v) {
                return Math.round(v * 100) / 100;
            }

            function formatHoras(h) {
                const n = h.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
                return h === 1 ? '1 hora' : `${n} horas`;
            }

            /**
             * Valor por hora com 4 casas, para mostrar a conta exata antes do arredondamento.
             */
            function formatValorHora(v) {
                return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
            }

            // =========== MEMÓRIA DE CÁLCULO ===========

            /**
             * Gera o passo a passo da hora extra e do adicional noturno com os dados do usuário.
             */
            function gerarMemoriaCalculo(d) {
                const hn = formatValorHora(d.horaNormal);
                const exata = centavos(d.horaNormal) === d.horaNormal;
                const itens = [];

                itens.push(
                    `<li><strong>Hora normal:</strong> o salário dividido pela carga horária mensal: ` +
                    `${formatBRL(d.salario)} ÷ ${d.jornada.toLocaleString('pt-BR')} h = <strong>${hn}</strong>` +
                    (exata ? '' : ` (exibido como ${formatBRL(d.horaNormal)}; a conta segue com as casas decimais para não acumular erro)`) +
                    '.' + (d.jornada === 220 ? ' As 220 horas são a carga mensal usual de quem trabalha 44 horas por semana.' : '') +
                    '</li>'
                );

                const extras = [
                    { qtd: d.qtdHE50, fator: 1.5, pct: '50%', total: d.totalHE50,
                      quando: 'o mínimo garantido pela Constituição para dias úteis' },
                    { qtd: d.qtdHE100, fator: 2, pct: '100%', total: d.totalHE100,
                      quando: 'comum em domingos e feriados trabalhados sem folga compensatória' }
                ];
                extras.forEach(function(e) {
                    if (e.qtd <= 0) return;
                    const valorHora = d.horaNormal * e.fator;
                    itens.push(
                        `<li><strong>Hora extra a ${e.pct}:</strong> a hora normal com acréscimo de ${e.pct} (${e.quando}): ` +
                        `${hn} × ${e.fator.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} = ` +
                        `${formatValorHora(valorHora)} por hora. Por ${formatHoras(e.qtd)}: ` +
                        `${formatValorHora(valorHora)} × ${e.qtd.toLocaleString('pt-BR')} = <strong>${formatBRL(e.total)}</strong>.</li>`
                    );
                });

                if (d.qtdNoturna > 0) {
                    const adicionalHora = d.horaNormal * 0.2;
                    const convertidas = d.qtdNoturna * 60 / 52.5;
                    itens.push(
                        `<li><strong>Adicional noturno:</strong> para o trabalhador urbano, o trabalho entre 22h e 5h ` +
                        `recebe pelo menos 20% a mais sobre a hora normal (CLT, art. 73). Esse acréscimo vale ` +
                        `${hn} × 20% = ${formatValorHora(adicionalHora)} por hora. Por ${formatHoras(d.qtdNoturna)}: ` +
                        `${formatValorHora(adicionalHora)} × ${d.qtdNoturna.toLocaleString('pt-BR')} = ` +
                        `<strong>${formatBRL(d.totalNoturno)}</strong>, pago além do salário dessas horas.</li>`
                    );
                    itens.push(
                        `<li><strong>Hora noturna reduzida:</strong> pela lei, cada hora noturna dura 52 minutos e 30 ` +
                        `segundos, então 7 horas de relógio contam como 8. Esta calculadora usa as horas exatamente como ` +
                        `você informou. Se as suas ${formatHoras(d.qtdNoturna)} são de relógio, elas equivalem a ` +
                        `${formatHoras(Math.round(convertidas * 100) / 100)} noturnas (${d.qtdNoturna.toLocaleString('pt-BR')} × 60 ÷ 52,5); ` +
                        `informe esse número para considerar a redução.</li>`
                    );
                }

                const parcelas = [];
                if (d.qtdHE50 > 0) parcelas.push(formatBRL(d.totalHE50));
                if (d.qtdHE100 > 0) parcelas.push(formatBRL(d.totalHE100));
                if (d.qtdNoturna > 0) parcelas.push(formatBRL(d.totalNoturno));

                const total = parcelas.length === 0
                    ? 'Nenhuma hora extra ou noturna foi informada, então não há valor a receber além do salário.'
                    : (parcelas.length === 1
                        ? `Total a receber: <strong>${formatBRL(d.total)}</strong> (valor bruto).`
                        : `Total: ${parcelas.join(' + ')} = <strong>${formatBRL(d.total)}</strong> (valor bruto).`);

                return `
                    <h3 class="memoria-calculo__titulo">Memória de cálculo: como chegamos a esse valor</h3>
                    <ol class="memoria-calculo__lista">${itens.join('')}</ol>
                    <p class="memoria-calculo__total">${total}</p>
                    <p class="memoria-calculo__nota">Convenções coletivas podem garantir percentuais maiores. Sobre esses
                    valores ainda incidem o reflexo no descanso semanal remunerado (DSR) e os descontos de INSS e
                    Imposto de Renda, que esta calculadora não inclui.</p>
                `;
            }

            // =========== VALIDAÇÃO ===========

            function limparErros() {
                document.querySelectorAll('.form-field').forEach(f => f.classList.remove('has-error'));
            }

            function marcarErro(id) {
                const el = document.getElementById(id);
                if (el) el.classList.add('has-error');
            }

            function validar(salario, jornada) {
                let ok = true;

                if (!salario || salario <= 0 || isNaN(salario)) {
                    marcarErro('field-salario');
                    ok = false;
                }
                if (!jornada || jornada <= 0 || isNaN(jornada)) {
                    marcarErro('field-jornada');
                    ok = false;
                }
                return ok;
            }

            // =========== RENDERIZAÇÃO ===========

            function criarLinha(label, desc, valor) {
                const div = document.createElement('div');
                div.className = 'result-line';
                const isZero = valor === 0;
                div.innerHTML = `
                    <div class="result-line__label">
                        <strong>${label}</strong>
                        <small>${desc}</small>
                    </div>
                    <div class="result-line__value ${isZero ? 'result-line__value--zero' : ''}">${formatBRL(valor)}</div>
                `;
                return div;
            }

            function renderizarResultado(dados) {
                resultadoLinhasEl.innerHTML = '';

                // Atualiza a caixa de hora normal
                valHoraNormal.textContent = formatBRL(dados.horaNormal);
                horaFormula.textContent = `${formatBRL(dados.salario)} ÷ ${dados.jornada}h`;

                // Horas extras 50%
                const descHE50 = dados.qtdHE50 > 0
                    ? `${dados.qtdHE50}h × ${formatBRL(dados.horaNormal)} × 1,50`
                    : 'Nenhuma hora informada';
                resultadoLinhasEl.appendChild(criarLinha(
                    'Horas Extras a 50%',
                    descHE50,
                    dados.totalHE50
                ));

                // Horas extras 100%
                const descHE100 = dados.qtdHE100 > 0
                    ? `${dados.qtdHE100}h × ${formatBRL(dados.horaNormal)} × 2,00`
                    : 'Nenhuma hora informada';
                resultadoLinhasEl.appendChild(criarLinha(
                    'Horas Extras a 100%',
                    descHE100,
                    dados.totalHE100
                ));

                // Adicional noturno
                const descNoturna = dados.qtdNoturna > 0
                    ? `${dados.qtdNoturna}h × ${formatBRL(dados.horaNormal)} × 20%`
                    : 'Nenhuma hora informada';
                resultadoLinhasEl.appendChild(criarLinha(
                    'Adicional Noturno (20%)',
                    descNoturna,
                    dados.totalNoturno
                ));

                // Total
                resultadoTotalEl.textContent = formatBRL(dados.total);
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
                const jornada = parseFloat(document.getElementById('jornada').value);
                const qtdHE50 = parseFloat(document.getElementById('he50').value) || 0;
                const qtdHE100 = parseFloat(document.getElementById('he100').value) || 0;
                const qtdNoturna = parseFloat(document.getElementById('noturna').value) || 0;

                if (!validar(salario, jornada)) {
                    return;
                }

                // --- Cálculos CLT ---
                const horaNormal = salario / jornada;

                // HE 50%: hora normal × 1.50
                const valorHE50 = horaNormal * 1.50;
                const totalHE50 = centavos(valorHE50 * qtdHE50);

                // HE 100%: hora normal × 2.00
                const valorHE100 = horaNormal * 2.00;
                const totalHE100 = centavos(valorHE100 * qtdHE100);

                // Adicional noturno: 20% da hora normal
                const adicionalNoturno = horaNormal * 0.20;
                const totalNoturno = centavos(adicionalNoturno * qtdNoturna);

                // Total = soma das linhas já arredondadas, como num holerite
                const total = centavos(totalHE50 + totalHE100 + totalNoturno);

                renderizarResultado({
                    salario,
                    jornada,
                    horaNormal,
                    qtdHE50,
                    qtdHE100,
                    qtdNoturna,
                    totalHE50,
                    totalHE100,
                    totalNoturno,
                    total
                });
            });

            // Limpa estado de erro ao digitar
            form.addEventListener('input', function(e) {
                const field = e.target.closest('.form-field');
                if (field) field.classList.remove('has-error');
            });

        })();
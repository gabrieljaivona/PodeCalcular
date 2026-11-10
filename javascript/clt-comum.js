/**
 * PodeCalcular - Utilitários trabalhistas compartilhados
 * --------------------------------------------------------
 * Usado pelas calculadoras de Rescisão e de 13º Salário, para que a
 * regra dos 15 dias tenha uma única implementação no site.
 * Exposto em window.PodeCalcularCLT.
 */

(function(global) {
    'use strict';

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

    global.PodeCalcularCLT = {
        parseDate: parseDate,
        contarMesesCLT: contarMesesCLT
    };

})(window);

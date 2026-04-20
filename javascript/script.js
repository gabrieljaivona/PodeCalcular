/**
         * Calculei Portal - Scripts principais
         * ------------------------------------
         * 1. Controle do Menu Hambúrguer (abrir/fechar + overlay + tecla ESC)
         * 2. Handler do formulário de busca (demo)
         *
         * Escrito em Vanilla JS puro - sem dependências.
         */

        (function() {
            'use strict';

            // =============== 1. MENU HAMBÚRGUER ===============
            const hamburger = document.getElementById('hamburgerBtn');
            const navMenu   = document.getElementById('mainNav');
            const overlay   = document.getElementById('menuOverlay');

            /**
             * Alterna o estado do menu (aberto / fechado).
             * Mantém aria-expanded sincronizado para acessibilidade.
             */
            function toggleMenu() {
                const isOpen = navMenu.classList.toggle('is-open');
                hamburger.classList.toggle('is-active', isOpen);
                overlay.classList.toggle('is-visible', isOpen);
                hamburger.setAttribute('aria-expanded', String(isOpen));
                hamburger.setAttribute('aria-label', isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação');

                // Trava o scroll do body quando o menu está aberto (UX mobile)
                document.body.style.overflow = isOpen ? 'hidden' : '';
            }

            /**
             * Fecha o menu (usado em cliques no overlay, ESC, e nos links internos).
             */
            function closeMenu() {
                if (navMenu.classList.contains('is-open')) {
                    toggleMenu();
                }
            }

            // Clique no botão hambúrguer
            hamburger.addEventListener('click', toggleMenu);

            // Clique no overlay escurecido fecha o menu
            overlay.addEventListener('click', closeMenu);

            // Fecha o menu ao clicar em qualquer link do menu (boa UX em SPAs e âncoras)
            navMenu.querySelectorAll('a').forEach(function(link) {
                link.addEventListener('click', closeMenu);
            });

            // Tecla ESC fecha o menu (acessibilidade)
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') closeMenu();
            });

            // Se a janela for redimensionada para um tamanho grande, garanta que
            // o menu/overlay voltem ao estado padrão sem travar o scroll.
            let resizeTimeout;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(function() {
                    if (window.innerWidth >= 1024) closeMenu();
                }, 150);
            });


            // =============== 2. BARRA DE PESQUISA ===============
            const searchForm  = document.getElementById('searchForm');
            const searchInput = document.getElementById('searchInput');

            searchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const query = searchInput.value.trim();

                if (!query) {
                    searchInput.focus();
                    return;
                }

                // Por enquanto apenas uma demonstração.
                // Em produção, redirecionar para a página de resultados:
                // window.location.href = '/buscar?q=' + encodeURIComponent(query);
                console.log('[Calculei] Busca solicitada:', query);
                alert('Busca por: "' + query + '"\n\n(Integração real com o backend de busca acontecerá nesta etapa.)');
            });


            // =============== 3. SMOOTH SCROLL PARA ÂNCORAS ===============
            // Suaviza a navegação via links internos (#trabalhador, #empreendedor etc.)
            // Funciona em conjunto com scroll-behavior: smooth no CSS.
            document.querySelectorAll('a[href^="#"]').forEach(function(link) {
                link.addEventListener('click', function(e) {
                    const targetId = this.getAttribute('href');
                    if (targetId.length > 1) {
                        const target = document.querySelector(targetId);
                        if (target) {
                            e.preventDefault();
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                });
            });

        })();
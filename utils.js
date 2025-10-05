/**
 * Módulo de Utilitários para AirdropBoard
 * Funções auxiliares para melhorar a experiência do usuário
 */

/**
 * Utilitários de Data e Tempo
 */
const DateUtils = {
    /**
     * Formatar data para exibição
     */
    formatDate(date, locale = 'pt-BR') {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Verificar se uma data está atrasada
     */
    isOverdue(date) {
        if (!date) return false;
        return new Date(date) < new Date();
    },

    /**
     * Calcular dias restantes até uma data
     */
    daysUntil(date) {
        if (!date) return null;
        const today = new Date();
        const target = new Date(date);
        const diffTime = target - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Gerar timestamp único
     */
    generateTimestamp() {
        return Date.now().toString();
    }
};

/**
 * Utilitários de Validação
 */
const ValidationUtils = {
    /**
     * Validar email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validar URL
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Sanitizar texto
     */
    sanitizeText(text) {
        if (!text) return '';
        return text.trim().replace(/[<>]/g, '');
    },

    /**
     * Validar comprimento de texto
     */
    validateLength(text, maxLength) {
        return text && text.length <= maxLength;
    }
};

/**
 * Utilitários de Performance
 */
const PerformanceUtils = {
    /**
     * Debounce para otimizar eventos
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle para limitar execução
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Lazy loading para imagens
     */
    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }
};

/**
 * Utilitários de Armazenamento
 */
const StorageUtils = {
    /**
     * Salvar dados com compressão
     */
    saveCompressed(key, data) {
        try {
            const compressed = JSON.stringify(data);
            localStorage.setItem(key, compressed);
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            return false;
        }
    },

    /**
     * Carregar dados com fallback
     */
    loadWithFallback(key, fallback = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            return fallback;
        }
    },

    /**
     * Verificar espaço disponível
     */
    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length;
            }
        }
        return total;
    },

    /**
     * Limpar dados antigos
     */
    clearOldData(maxAge = 30) {
        const now = Date.now();
        const maxAgeMs = maxAge * 24 * 60 * 60 * 1000;
        
        for (let key in localStorage) {
            if (key.startsWith('temp_')) {
                try {
                    const data = JSON.parse(localStorage[key]);
                    if (data.timestamp && (now - data.timestamp) > maxAgeMs) {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    // Remove dados corrompidos
                    localStorage.removeItem(key);
                }
            }
        }
    }
};

/**
 * Utilitários de Interface
 */
const UIUtils = {
    /**
     * Mostrar loading
     */
    showLoading(element) {
        if (element) {
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
            element.disabled = true;
        }
    },

    /**
     * Esconder loading
     */
    hideLoading(element, originalText = '') {
        if (element) {
            element.innerHTML = originalText;
            element.disabled = false;
        }
    },

    /**
     * Animar elemento
     */
    animateElement(element, animation = 'fadeIn') {
        if (element) {
            element.style.animation = `${animation} 0.3s ease-in-out`;
            setTimeout(() => {
                element.style.animation = '';
            }, 300);
        }
    },

    /**
     * Copiar texto para clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    },

    /**
     * Gerar cor aleatória
     */
    generateRandomColor() {
        const colors = [
            '#2563eb', '#16a34a', '#f59e42', '#ef4444',
            '#a855f7', '#06b6d4', '#6b7280', '#f97316'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
};

/**
 * Utilitários de Exportação
 */
const ExportUtils = {
    /**
     * Exportar dados como JSON
     */
    exportAsJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        this.downloadBlob(blob, filename || 'export.json');
    },

    /**
     * Exportar dados como CSV
     */
    exportAsCSV(data, filename) {
        if (!Array.isArray(data) || data.length === 0) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => 
                JSON.stringify(row[header] || '')
            ).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        this.downloadBlob(blob, filename || 'export.csv');
    },

    /**
     * Download de blob
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.DateUtils = DateUtils;
    window.ValidationUtils = ValidationUtils;
    window.PerformanceUtils = PerformanceUtils;
    window.StorageUtils = StorageUtils;
    window.UIUtils = UIUtils;
    window.ExportUtils = ExportUtils;
}

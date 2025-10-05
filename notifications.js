/**
 * Sistema de Notificações para AirdropBoard
 * Gerencia notificações, alertas e lembretes
 */

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.permission = 'default';
        this.init();
    }

    /**
     * Inicializar o sistema de notificações
     */
    async init() {
        // Verificar suporte a notificações
        if ('Notification' in window) {
            this.permission = Notification.permission;
            
            if (this.permission === 'default') {
                this.permission = await Notification.requestPermission();
            }
        }

        // Verificar notificações pendentes ao carregar
        this.checkPendingNotifications();
        
        // Configurar verificação periódica
        setInterval(() => {
            this.checkPendingNotifications();
        }, 60000); // Verificar a cada minuto
    }

    /**
     * Solicitar permissão para notificações
     */
    async requestPermission() {
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
            return this.permission === 'granted';
        }
        return false;
    }

    /**
     * Mostrar notificação do navegador
     */
    showBrowserNotification(title, options = {}) {
        if (this.permission !== 'granted') return false;

        const notification = new Notification(title, {
            icon: 'input_file_0.png',
            badge: 'input_file_0.png',
            ...options
        });

        // Auto-fechar após 5 segundos
        setTimeout(() => {
            notification.close();
        }, 5000);

        return notification;
    }

    /**
     * Mostrar toast na aplicação
     */
    showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${this.getBootstrapColor(type)} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${this.getIcon(type)} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Inicializar toast do Bootstrap
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: duration
        });
        
        bsToast.show();

        // Remover elemento após fechar
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });

        return toast;
    }

    /**
     * Criar container de toasts se não existir
     */
    createToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Agendar notificação para uma data específica
     */
    scheduleNotification(id, title, message, date, options = {}) {
        const notification = {
            id,
            title,
            message,
            date: new Date(date),
            options,
            created: new Date(),
            sent: false
        };

        this.notifications.push(notification);
        this.saveNotifications();
        
        return notification;
    }

    /**
     * Cancelar notificação agendada
     */
    cancelNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.saveNotifications();
    }

    /**
     * Verificar notificações pendentes
     */
    checkPendingNotifications() {
        const now = new Date();
        
        this.notifications.forEach(notification => {
            if (!notification.sent && notification.date <= now) {
                this.sendScheduledNotification(notification);
                notification.sent = true;
            }
        });

        // Limpar notificações antigas (mais de 7 dias)
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        this.notifications = this.notifications.filter(n => 
            !n.sent || n.date > weekAgo
        );

        this.saveNotifications();
    }

    /**
     * Enviar notificação agendada
     */
    sendScheduledNotification(notification) {
        // Notificação do navegador
        this.showBrowserNotification(notification.title, {
            body: notification.message,
            tag: notification.id,
            ...notification.options
        });

        // Toast na aplicação
        this.showToast(
            `${notification.title}: ${notification.message}`,
            'warning',
            5000
        );
    }

    /**
     * Notificar sobre prazos próximos
     */
    notifyUpcomingDeadlines(cards) {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        cards.forEach(card => {
            if (!card.prazo) return;

            const deadline = new Date(card.prazo);
            const daysUntil = DateUtils.daysUntil(card.prazo);

            // Notificar se o prazo é amanhã
            if (deadline <= tomorrow && deadline > now) {
                this.showToast(
                    `Prazo amanhã: ${card.titulo}`,
                    'warning',
                    5000
                );
            }
            // Notificar se o prazo é na próxima semana
            else if (deadline <= nextWeek && daysUntil === 7) {
                this.showToast(
                    `Prazo em uma semana: ${card.titulo}`,
                    'info',
                    4000
                );
            }
            // Notificar se está atrasado
            else if (DateUtils.isOverdue(card.prazo)) {
                this.showToast(
                    `Atrasado: ${card.titulo}`,
                    'danger',
                    6000
                );
            }
        });
    }

    /**
     * Salvar notificações no localStorage
     */
    saveNotifications() {
        try {
            localStorage.setItem('airdrop-notifications', JSON.stringify(this.notifications));
        } catch (error) {
            console.error('Erro ao salvar notificações:', error);
        }
    }

    /**
     * Carregar notificações do localStorage
     */
    loadNotifications() {
        try {
            const saved = localStorage.getItem('airdrop-notifications');
            if (saved) {
                this.notifications = JSON.parse(saved).map(n => ({
                    ...n,
                    date: new Date(n.date),
                    created: new Date(n.created)
                }));
            }
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
            this.notifications = [];
        }
    }

    /**
     * Obter cor do Bootstrap para o tipo
     */
    getBootstrapColor(type) {
        const colors = {
            success: 'success',
            error: 'danger',
            warning: 'warning',
            info: 'info',
            danger: 'danger'
        };
        return colors[type] || 'primary';
    }

    /**
     * Obter ícone para o tipo
     */
    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle',
            danger: 'fa-times-circle'
        };
        return icons[type] || 'fa-bell';
    }

    /**
     * Limpar todas as notificações
     */
    clearAll() {
        this.notifications = [];
        this.saveNotifications();
    }

    /**
     * Obter estatísticas das notificações
     */
    getStats() {
        const now = new Date();
        return {
            total: this.notifications.length,
            pending: this.notifications.filter(n => !n.sent && n.date > now).length,
            sent: this.notifications.filter(n => n.sent).length,
            overdue: this.notifications.filter(n => !n.sent && n.date <= now).length
        };
    }
}

// Inicializar sistema de notificações
let notificationManager;

document.addEventListener('DOMContentLoaded', () => {
    notificationManager = new NotificationManager();
    
    // Carregar notificações salvas
    notificationManager.loadNotifications();
    
    // Exportar para uso global
    window.notificationManager = notificationManager;
});

// Exportar classe para uso em outros módulos
if (typeof window !== 'undefined') {
    window.NotificationManager = NotificationManager;
}

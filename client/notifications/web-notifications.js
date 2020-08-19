export class WebNotifications {
    static _checkNotificationsAvailable() {
        return "Notification" in window;
    }

    static _checkNotificationsAllowed() {
        return Notification.permission === "granted";
    }

    static _requestPermissionAndNotify(callback) {
        if (Notification.permission !== "denied") {
            Notification.requestPermission((permission) => {
                if (permission === "granted") {
                    callback();
                }
            });
        }
    }

    static notify(title, message) {
        const options = {
            icon: "/icons/favicon-128.png",
            badge: "/icons/favicon-128.png",
        };
        if (message) {
            options.body = message;
            options.requireInteraction = false;
        }
        const openNotification = () => {
            new Notification(title, options);
        };
        if (!WebNotifications._checkNotificationsAvailable()) {
            console.log("Notifications not available");
            return;
        }
        if (WebNotifications._checkNotificationsAllowed()) {
            openNotification();
        } else {
            WebNotifications._requestPermissionAndNotify(openNotification);
        }
    }
}

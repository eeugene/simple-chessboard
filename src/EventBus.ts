export enum EventType {
    MOVE_PIECE
}

class Listener {
    constructor(public event: EventType, public callback: (data: any) => void) {
    }
}

class EventBus {
    private listeners: Listener[];
    constructor() {
        this.listeners = [];
    }

    subscribe(event: EventType, callback: (data: any) => void) {
        this.listeners.push(new Listener(event, callback));
    }

    publish(event: EventType, data: any) {
        const listeners = this.listeners.filter(listener => listener.event === event);
        console.log('listeners', listeners);
        listeners.forEach(listener => listener.callback(data));
    }
}

export const eventBus = new EventBus();

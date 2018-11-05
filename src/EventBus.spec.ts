import { eventBus, EventType } from './EventBus';

test('init', () => {
    eventBus.publish(EventType.MOVE_PIECE, {});
});
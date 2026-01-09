import { MemoryDevice } from "../pc.ts";

export default class ROM extends MemoryDevice {
    constructor(start: number, size: number) {
        super(start, size);
        this._segments.mem.set_value = undefined;
    }
}
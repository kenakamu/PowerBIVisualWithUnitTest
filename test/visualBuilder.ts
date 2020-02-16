import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import { VisualBuilderBase } from "powerbi-visuals-utils-testutils";
import { Visual } from "./../src/visual";
export class VisualBuilder extends VisualBuilderBase<Visual> {
    constructor(width: number, height: number) {
        super(width, height);
    }

    protected build(options: VisualConstructorOptions) {
        return new Visual(options);
    }

    public get mainElement(): JQuery {
        return this.element.find("svg");
    }

    public get barElement(): JQuery {
        return this.element.find(".bar");
    }
}
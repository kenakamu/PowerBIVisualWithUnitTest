import powerbi from "powerbi-visuals-api";
import { VisualBuilder } from "./VisualBuilder";
import DataView = powerbi.DataView;
import {
    Visual as VisualClass
} from "../src/visual";
import { VisualData } from "./visualData";

describe("Test Visual", () => {
    let visualBuilder: VisualBuilder;
    let dataView: DataView;
    let visualData: VisualData;

    //　テストの準備
    beforeEach(() => {
        // ビジュアルの作成とデータの取得
        visualBuilder = new VisualBuilder(500, 500);
        visualData = new VisualData()
        dataView = visualData.getDataView();   
    });

    it("should main element in DOM", () => {
        // SVC が存在するか確認
        expect(visualBuilder.mainElement).toBeInDOM();
    });

    it("should render 7 bars", (done) => {
        // DataView をバインドする
        visualBuilder.updateRenderTimeout(dataView, () => {      
            // バインドが完了したらバーの数を確認
            expect(visualBuilder.barElement.length).toEqual(7);
            done();
        });
    });
});
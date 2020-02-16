import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;
import { valueType } from "powerbi-visuals-utils-typeutils";
import ValueType = valueType.ValueType;
import {
    testDataViewBuilder
} from "powerbi-visuals-utils-testutils";
import TestDataViewBuilder = testDataViewBuilder.TestDataViewBuilder;

export class VisualData extends TestDataViewBuilder {
    public valuesCategory: string[] = [
        "Infrastructure",
        "Services",
        "Distribution",
        "Manufacturing",
        "Office & Administrative",
        "BU",
        "R&D"];
    public valuesMeasure: number[] = [
        23536681.479000024,
        572443.5630000085,
        -561203.5199999921,
        -1061897.1090000793,
        -2429005.238999985,
        -2846388.948000014,
        -2970340.0979999974];
    
    public constructor() {
        super();
    }
    public static ColumnCategory: string = "Category";
    public static ColumnValue: string = "Measure";
    public getDataView(columnNames?: string[]): DataView {
        let dataView: any = this.createCategoricalDataViewBuilder(
            [{
                source: {
                    displayName: "Business Area",
                    queryName: "Business Area.Business Area",
                    type: ValueType.fromDescriptor({ text: true }),
                    roles: {
                        category: true
                    },
                },
                values: this.valuesCategory
            }],
            [{
                source: {
                    displayName: "Var Plan",
                    queryName: "Fact.Var Plan",
                    isMeasure: true,
                    roles: {
                        measure: true
                    },
                    type: ValueType.fromDescriptor({ numeric: true })
                },
                values: this.valuesMeasure
            }],
            columnNames).build();

        let maxLocal = 0;
        this.valuesMeasure.forEach((item) => {
            if (item > maxLocal) {
                maxLocal = item;
            }
        });
        (<any> dataView).categorical.values[0].maxLocal = maxLocal;

        let minLocal = 0;
        this.valuesMeasure.forEach((item) => {
            if (item < minLocal) {
                minLocal = item;
            }
        });
        (<any> dataView).categorical.values[0].minLocal = minLocal;
        return dataView;
    }
}
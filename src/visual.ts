/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import * as d3 from 'd3';
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

interface BarChartViewModel {
    dataPoints: BarChartDataPoint[];
    dataMax: number;
    dataMin: number;
}

interface BarChartDataPoint {
    value: number;
    category: string;
}

import { VisualSettings } from "./settings";

export class Visual implements IVisual {
    private svg: d3.Selection<d3.BaseType, any, HTMLElement, any>; // グラフ全体用
    private barContainer: d3.Selection<d3.BaseType, any, any, any>; // 棒グラフ用
    private xAxis: d3.Selection<d3.BaseType, any, any, any>; // X軸表示用
    private host: IVisualHost;
    private settings: VisualSettings;

    constructor(options: VisualConstructorOptions) {
        // カスタムビジュアルを配置しているホストの情報を取得
        this.host = options.host;
        // カスタムビジュアルのエリアを取得し、svg を追加
        this.svg = d3.select<SVGElement, any>(options.element as any)
            .append('svg');
        // svg 内に棒グラフ用のエリアと xAxis 用のエリアをそれぞれグループ指定
        this.barContainer = this.svg
            .append('g');
        this.xAxis = this.svg
            .append('g')
            .classed('xAxis', true);
    }

    public update(options: VisualUpdateOptions) {
        // Power BI より データを取得
        let viewModel: BarChartViewModel = Visual.visualTransform(options, this.host);
        // 現在のビジュアルの幅と高さを取得
        let width = options.viewport.width;
        let height = options.viewport.height;
        //　棒グラフ用にマージンを指定。bottom を 25 上げる
        let margin = { top: 0, bottom: 25, left: 0, right: 0 }
        // メインの svg をカスタムビジュアルと同じ大きさに指定
        this.svg
            .attr("width", width)
            .attr("height", height);

        // 棒グラフ用の高さとして、マージンの bottom を引いたものを用意
        height -= margin.bottom;
        // 値が負になることを考慮して高さマップ。
        let max = Math.max(viewModel.dataMax, -viewModel.dataMin);
        let yScale = d3.scaleLinear()
            .domain([0, max])
            .range([0, height * (max / (viewModel.dataMax - viewModel.dataMin))])
            .nice();

        // X軸スケール用の計算。カテゴリをドメインとし、全体の幅をグラフの数で分割
        // グラフとグラフの間は 0.1 の割合であける。
        let xScale = d3.scaleBand()
            .domain(viewModel.dataPoints.map(d => d.category))
            .rangeRound([0, width])
            .padding(0.1);

        // xAxis の場所をグラフ内各棒の下に設定
        let xAxis = d3.axisBottom(xScale);
        // xAxis の属性として　transform を追加。
        this.xAxis
            .attr('transform', 'translate(0, ' + height + ')')
            .call(xAxis);
        // 棒グラフ内のすべてのグラフを取得し、データをバインド
        let bars = this.barContainer
            .selectAll('.bar')
            .data(viewModel.dataPoints);
        // 各グラフ毎に rect (四角) を追加してクラスを定義
        // 高さや位置を指定
        bars.enter()
            .append('rect')
            .classed('bar', true)
            .attr("width", xScale.bandwidth())
            .attr("height", d => yScale(Math.abs(d.value)))
            .attr("y", d => {
                if (d.value > 0) {
                    return yScale(max) - yScale(Math.abs(d.value));
                }
                else {
                    return yScale(max);
                }
            })
            .attr("x", d => xScale(d.category))
            .attr("fill", d => {
                if (d.value > 0) {
                    return 'green';
                }
                else {
                    return 'red';
                }
            });
        // 値がないグラフがあった場合は表示から削除
        bars.exit()
            .remove();
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return VisualSettings.parse(dataView) as VisualSettings;
    }

    /** 
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the 
     * objects and properties you want to expose to the users in the property pane.
     * 
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }

    private static visualTransform(options: VisualUpdateOptions, host: IVisualHost): BarChartViewModel {
        // Power BI からのデータを受け取る
        // データは dataViews プロパティに存在
        let dataViews = options.dataViews;
        // 空の viewModel を作成。
        let viewModel: BarChartViewModel = {
            dataPoints: [],
            dataMax: 0,
            dataMin: 0
        }
        // 期待した値があるか確認。なければ空データを返す
        if (!dataViews
            || !dataViews[0]
            || !dataViews[0].categorical
            || !dataViews[0].categorical.categories
            || !dataViews[0].categorical.categories[0].source
            || !dataViews[0].categorical.values)
            return viewModel;
        // 値があった場合はそれぞれ変数に一旦抜き出し
        let categorical = dataViews[0].categorical;
        let category = categorical.categories[0];
        let dataValue = categorical.values[0]
        // dataPoint のインスタンス化
        let barChartDataPoints: BarChartDataPoint[] = [];
        let dataMax: number;
        let dataMin: number;
        // カテゴリと値のセットを dataPoint に入れていく
        for (let i = 0, len = Math.max(category.values.length, dataValue.values.length); i < len; i++) {
            barChartDataPoints.push({
                category: <string> category.values[i],
                value: <number> dataValue.values[i]
            });
        }
        // 値の最大を取得
        dataMax = <number> dataValue.maxLocal;
        // 値の最小値を取得
        dataMin = <number> dataValue.minLocal;
        // viewModel を返す
        return {
            dataPoints: barChartDataPoints,
            dataMax: dataMax,
            dataMin: dataMin
        };
    }

}

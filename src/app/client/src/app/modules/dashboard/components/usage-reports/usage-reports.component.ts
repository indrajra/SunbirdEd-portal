import { Component, OnInit } from '@angular/core';
import { UsageService } from './../../services';
import * as _ from 'lodash';
import { DomSanitizer } from '@angular/platform-browser';
import { UserService } from '@sunbird/core';
import { ToasterService, ResourceService, INoResultMessage } from '@sunbird/shared';
@Component({
  selector: 'app-usage-reports',
  templateUrl: './usage-reports.component.html',
  styleUrls: ['./usage-reports.component.scss']
})
export class UsageReportsComponent implements OnInit {

  reportMetaData: any;
  chartData: Array<object> = [];
  table: any;
  isTableDataLoaded = false;
  currentReport: any;
  slug: string;
  noResult: boolean;
  noResultMessage: INoResultMessage;

  constructor(private usageService: UsageService, private sanitizer: DomSanitizer,
    public userService: UserService, public toasterService: ToasterService,
    public resourceService: ResourceService) { }

  ngOnInit() {

    this.slug = _.get(this.userService, 'userProfile.rootOrg.slug');
    this.usageService.getData(`/reports/${this.slug}/config.json`).subscribe(data => {
      if (_.get(data, 'responseCode') === 'OK') {
        this.noResult = false;
        this.reportMetaData = _.get(data, 'result');
        if (this.reportMetaData[0]) { this.renderReport(this.reportMetaData[0]); }
      }
    }, (err) => {
      console.log(err);
      this.noResultMessage = {
        'messageText': this.resourceService.messages.stmsg.m0131
      };
      this.noResult = true;
    });
  }
  renderReport(report: any) {
    this.currentReport = report;
    this.isTableDataLoaded = false;
    const url = report.dataSource;
    this.usageService.getData(url).subscribe((response) => {
      this.table = {};
      this.chartData = [];
      if (_.get(response, 'responseCode') === 'OK') {
        const data = _.get(response, 'result');
        if (_.get(report, 'chart')) { this.createChartData(_.get(report, 'chart'), data); }
        if (_.get(report, 'table')) { this.renderTable(_.get(report, 'table'), data); }
      }

    });
  }

  createChartData(charts, data) {
    _.forEach(charts, chart => {
      const chartObj: any = {};
      chartObj.options = _.get(chart, 'options') || { responsive: true };
      chartObj.colors = _.get(chart, 'colors') || ['#024F9D'];
      chartObj.chartType = _.get(chart, 'chartType') || 'line';
      chartObj.labels = _.get(chart, 'labels') || _.get(data, _.get(chart, 'labelsExpr'));
      chartObj.legend = (_.get(chart, 'legend') === false) ? false : true;
      chartObj.datasets = [];
      _.forEach(chart.datasets, dataset => {
        chartObj.datasets.push({
          label: dataset.label,
          data: _.get(dataset, 'data') || _.get(data, _.get(dataset, 'dataExpr'))
        });
      });
      this.chartData.push(chartObj);
    });

  }

  renderTable(table, data) {
    this.table.header = _.get(table, 'columns') || _.get(data, _.get(table, 'columnsExpr'));
    this.table.data = _.get(table, 'values') || _.get(data, _.get(table, 'valuesExpr'));
    this.isTableDataLoaded = true;
  }

  downloadCSV(url) {
    window.open(url, '_blank');
  }

  transformHTML(data: any) {
    return this.sanitizer.bypassSecurityTrustHtml(data);
  }
}

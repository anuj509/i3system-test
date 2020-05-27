import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { DataService } from '../services/data.service';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { takeUntil, throttleTime, mergeMap, scan, map, tap } from 'rxjs/operators';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
// import * as mockData from '../../assets/data/countries.json';
import * as _ from 'lodash';

@Component({
  selector: 'app-sample1',
  templateUrl: './sample1.component.html',
  styleUrls: ['./sample1.component.scss']
})
export class Sample1Component implements OnInit, OnDestroy {
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;

  batch = 20; // defining batch size
  pageIndex = 0; // page offset
  theEnd = false; // to flag that we have reached to end of list

  offset = new BehaviorSubject(null);
  infinite: Observable<any[]>;

  // countries;
  private _onDestroy = new Subject<void>();
  constructor(private dataService: DataService) { 
    const batchMap = this.offset.pipe(
      throttleTime(500),
      mergeMap(n => this.getBatch(n)),
      scan((acc, batch) => {
        // console.log(Object.values(acc),batch);
        return [...Object.values(acc), ...batch ];
      }, [])
    );

    this.infinite = batchMap;
  }

  ngOnInit(): void {
  }

  getBatch(offset) {
    return this.dataService.getCountries()
    .pipe(takeUntil(this._onDestroy))
    .pipe(
        tap(arr => (arr.length ? null : (this.theEnd = true))),
        map((arr) => {
          let newOffset = offset;
          this.pageIndex += this.batch;
          let items = arr.slice(newOffset,this.pageIndex); //slicing new items from the array of countries
          // console.log(items);
          return items;
        })
    );
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }


  nextBatch(e, offset) {
    if (this.theEnd) {
      return;
    }

    const end = this.viewport.getRenderedRange().end;
    const total = this.viewport.getDataLength();
    // console.log(`${end}, '>=', ${total}`,offset);
    if (end === total) {// this checks the list and if equals then we have reached the end of current index offset in view port.
      this.offset.next(offset); //as soon as offset is set subject is changes hence it will call getBatch via const batchmap and update infinite variable
    }
  }

  trackByIdx(i) {
    return i;
  }

}

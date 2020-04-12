
import {
  DataModel,
} from '@phosphor/datagrid';

import TypedFastBitSet = require('typedfastbitset');


export
interface ColumnBin {
  label: string;
  count: number;
  bitset: TypedFastBitSet;
  linked: TypedFastBitSet;
}

export
interface ColumnStats {
  header: string;
  totalCount: number;
  maxBinCount: number;
  hoveredBin: number;
  nullBin: ColumnBin;
  bins: Array<ColumnBin>;
  isLinked: boolean;
  desc: string;
  extra: string;
  min?: number;
  max?: number;
}


export
class TableDataModel extends DataModel {

  setHoveredBin(column: number, bin: number | 'null'): void {
    if (column !== this._hoveredBin.column) {
      // Reset old column
      this.emitChanged({
        type: 'cells-changed',
        region: 'column-header',
        row: 0,
        column: this._hoveredBin.column,
        rowSpan: 1,
        columnSpan: 1
      });
    }

    if (column != this._hoveredBin.column || bin !== this._hoveredBin.bin) {
      this._hoveredBin = {
        column: column,
        bin: bin
      }

      this.emitChanged({
        type: 'cells-changed',
        region: 'column-header',
        row: 0,
        column: column,
        rowSpan: 1,
        columnSpan: 1
      });
    }
  }

  filterBin(bitset: TypedFastBitSet | null, isNew: boolean): void {
    if (bitset !== null) {
      if (this._currentBitset === null || isNew) {
        this._currentBitset = bitset.clone()
      } else if (!isNew) {
        this._currentBitset.union(bitset);
      } 

      let bs = this._currentBitset;
      this._filteredSet = bs.array();

      for (let columnStat of this._columnStats) {
        columnStat.isLinked = true;
        let nullBin = columnStat.nullBin;
        nullBin.linked = bs.clone();

        for (let columnBin of columnStat.bins) {
          //columnBin.linked = bin.bitset.new_intersection(columnBin.bitset);
          columnBin.linked.words.set(columnBin.bitset.words);
          columnBin.linked.intersection(bs);
        }
      }
    } else {
      this._filteredSet = null;
      this._currentBitset = null;
      for (let columnStat of this._columnStats) {
        columnStat.isLinked = false;
        /*for (let columnBin of columnStat.bins) {
          columnBin.linked = null;
        }*/
      }
    }

    this.emitChanged({
      type: 'model-reset'
    });
  }

  setData(data: Array<Array<any>>, keys: Array<string>, types: Array<string>): void {
    this._data = data;
    this._types = types;

    this._columnStats = [];
    let total = data.length;

    let desc: string;


    for (let column = 0; column < keys.length; column++) {

      let header = keys[column];
      let type = types[column];

      let nullCount = 0;
      let nullBitset = new TypedFastBitSet();
      let maxBinCount = 0;
      let min, max;

      let counts = new Map<string, TypedFastBitSet>();

      for (let j = 0; j < total; j++) {
        let val = data[j][column];

        if (val === null) {
          nullBitset.add(j);
          nullCount += 1;
          continue;
        }

        if (type === 'float' || type === 'integer') {
          if (min === undefined) {
            min = val;
          } else {
            min = Math.min(min, val);
          }
          if (max === undefined) {
            max = val;
          } else {
            max = Math.max(max, val);
          }
        } else if (type === 'string' || type === 'boolean') {
          let v = val as string;
          let count = counts.get(v) || new TypedFastBitSet();
          count.add(j);
          counts.set(v, count);
        }
      }

      let bins: Array<ColumnBin> = [];
      for (let [key, value] of counts) {
        value.trim()
        bins.push({ label: key, bitset: value, count: value.size(), linked: value.clone() });
        maxBinCount = Math.max(value.size(), maxBinCount);
      }

      // Second pass
      if (min === max) {
        desc = String(min);
      } else {
        desc = `${min} \u2013 ${max}`;
      }

      switch (type) {
        case 'float':
        case 'integer': {
          // Add intermediate bins
          if (max === min) {
            let count = counts.get(max) || new TypedFastBitSet();
            for (let i = 0; i < total; ++i) {
              count.add(i);
            }
            counts.set(max, count);
          } else {
            let diff = max - min;
            // Bin by order of magnitude
            let power = Math.floor(Math.log(diff)/Math.LN10);
            let div = Math.pow(10, power);

            if (type !== 'integer' && power === 0) {
              let subbin = diff / div;
              if (subbin <= 2.) {
                div /= 5;
                power = Math.floor(Math.log(div) / Math.LN10);
              } else if (subbin <= 5.) {
                div /= 2;
                power = Math.floor(Math.log(div) / Math.LN10);
              }
            }
            //if
          }

        }
        break;
        case 'string':{
          // reorder counts
          bins.sort((a, b) => b.count - a.count);
          desc = `${bins.length} Categor` + ((bins.length > 1) ? 'ies' : 'y');
        }
        break;
      }

      this._columnStats.push({
        header: header,
        totalCount: total,
        maxBinCount: maxBinCount,
        hoveredBin: -1,
        nullBin: {
          label: 'Missing values',
          bitset: nullBitset,
          count: nullCount,
          linked: nullBitset.clone()
        },
        bins: bins,
        isLinked: false,
        desc: desc,
        extra: "",
        min: min,
        max: max
      });
    }

    this.emitChanged({ type: 'model-reset' });
  }

  rowCount(region: DataModel.RowRegion): number {
    if (region === 'body') {
      return (this._filteredSet === null) ? this._data.length : this._filteredSet.length;
    } else if (region === 'column-header') {
      return 2;
    } else {
      return 0;
    }
  }

  columnCount(region: DataModel.ColumnRegion): number {
    return region === 'body' ? this._columnStats.length : 1;
  }

  data(region: DataModel.CellRegion, row: number, column: number): any {
    if (region === 'corner-header' && row === 0) {
      return this.rowCount('body');
    } else if (region === 'row-header') {
      return row + 1;
    } else if (region === 'column-header') {
      if (row === 1) {
        return this._quickFilters[1].get(column) || null;
      }
      if (column == this._hoveredBin.column && this._hoveredBin.bin !== -1) {
        let columnStat = this._columnStats[column];
        let bin = this._hoveredBin.bin;
        let frac: number, count: number;
        let extra: string, desc: string;

        let columnBin: ColumnBin;

        if (bin === 'null') {
          columnBin = columnStat.nullBin;
        } else {
          columnBin = columnStat.bins[bin];
        }
        desc = columnBin.label;
        if (columnStat.isLinked) {
          count = columnBin.linked.size();
          frac = 100 * (count / columnBin.count);
          extra = ` (${count}/${columnBin.count} - ${frac.toFixed(1)}%)`
        } else {
          count = columnBin.count;
          frac = 100 * (count / this._data.length);
          extra = ` (${count} - ${frac.toFixed(1)}%)`
        }
        return { ...this._columnStats[column], desc: desc, extra: extra, hoveredBin: bin};
      }
      return this._columnStats[column];
    }
    else if (region === 'body') {
      if (this._filteredSet !== null) {
        row = this._filteredSet[row];
      }
      return this._data[row][column];
    }
  }

  tooltip(region: DataModel.CellRegion, row: number, column: number): any {
    if (this._filteredSet !== null) {
      row = this._filteredSet[row];
    }
    let dataRow = this._data[row];

    let tooltip = [];
    for (let i = 0; i < this._columnStats.length; ++i) {
      let field = [this._columnStats[i].header, dataRow[i]];
      tooltip.push(field);
    }

    return tooltip;
  }

  metadata(region: DataModel.CellRegion, row: number, column: number): DataModel.Metadata {
    return { 'type': this._types[column] };
  }

  cellEdited(region: DataModel.CellRegion, row: number, column: number, value: string): void {
    if (region === 'corner-header' || region === 'column-header') {
      let quickFilter = (region === 'corner-header') ? this._quickFilters[0] : this._quickFilters[1];

      if (value !== '') {
        quickFilter.set(column, value);

        let bins = this._columnStats[column].bins;
        let found = false;
        let val = value.toLowerCase();

        this.filterBin(null, false);
        for (let i = 0; i < bins.length; i+=1) {
          let bin = bins[i];
          if (bin.label.toString().toLowerCase().startsWith(val)) {
            this.filterBin(bin.bitset, false);
            found = true;
            //break;
          }
        }
        if (!found) {
          this._filteredSet = [];
          this.emitChanged({
            type: 'model-reset'
          });
        }
      } else {
        quickFilter.delete(column);
        this.filterBin(null, false);
      }

      this.emitChanged({
        type: 'cells-changed',
        region: region,
        row: row, rowSpan: 1,
        column: column, columnSpan: 1
      });
    }
  }

  private _data: Array<Array<any>> = [];
  private _types: Array<string> = [];
  private _columnStats: Array<ColumnStats> = [];

  private _quickFilters: [Map<number, any>, Map<number, any>] = [new Map(), new Map()];

  private _hoveredBin: Private.IHoverBin = {column: -1, bin: -1};

  private _filteredSet: Array<number> | null = null;
  private _currentBitset: TypedFastBitSet | null = null
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * An object which represents the bin currently hovered.
   */
  export
  interface IHoverBin {
    /**
     * The column index of the first cell in the region.
     */
    column: number;

    /**
     * The column bin that is hovered
     */
    bin: number | 'null';
  }
}

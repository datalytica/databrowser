/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


import {
  DockPanel, StackedPanel, Widget
} from '@phosphor/widgets';

import {
  TextIconRenderer as TextRenderer, HeaderRenderer
} from './cellrenderer';

import {
  TableDataModel
} from './tabledatamodel'

import {
  DataGrid, BasicSelectionModel, BasicKeyHandler, CellRenderer, RendererMap
} from '@phosphor/datagrid';

import {
  MouseHandler as BasicMouseHandler
} from './mousehandler';

import '../style/index.css';



function createWrapper(content: Widget, title: string): Widget {
  let wrapper = new StackedPanel();
  wrapper.addClass('content-wrapper');
  wrapper.addWidget(content);
  wrapper.title.label = title;
  return wrapper;
}


/*function formatSingleTooltip(config: CellRenderer.CellConfig) : string {
  let { region, value } = config;
  if (region !== 'body' || value === null || value === undefined) {
    return '';
  }

  let tooltip: string[] = [];

  try {
    let [label, val] = value;
    tooltip.push(
        `<span>${label}:</span><span class="data">${val}</span>`
    );
  } catch (err) {
    tooltip.push(
        `<span class="data">${value}</span>`
    );
  }

  return tooltip.join('');
}*/

function formatMultiTooltip(config: CellRenderer.CellConfig) : string {
  let { region, value } = config;
  if (region !== 'body' || value === null || value === undefined) {
      return '';
  }
  let tooltip = [];
  for (let i = 0; i < value.length; i++) {
      let [label, val] = value[i];
      tooltip.push(`<span>${label}:</span><span class="data">${val}</span>`);
  }
  return tooltip.join('');
}


function main(): void {

  let model = new TableDataModel();

  fetch('data.json').then( res => {
    res.json().then( result => {
      model.setData(result.data, result.keys, result.types);
    })
  });

  const defaultSizes: DataGrid.DefaultSizes = {
    rowHeight: 20,
    columnWidth: 200,
    rowHeaderWidth: 100,
    columnHeaderHeight: 25
  };

  const lineColor = '#DDDDDD';
  const headerColor = '#F5F7F7';
  const headerTextColor = '#737373';
  const bodyTextColor = '#2B2B2B';

  const font = '400 12px Roboto, "Helvetica Neue", sans-serif';
  const headerFont = '600 12px Roboto, "Helvetica Neue", sans-serif';
  //const axisFont = '300 11px Roboto, "Helvetica Neue", sans-serif';

  const style: DataGrid.Style = {
    ...DataGrid.defaultStyle,
    voidColor: headerColor,
    backgroundColor: '#FFFFFF',
    gridLineColor: lineColor,    
    //verticalGridLineColor: lineColor,
    headerBackgroundColor: headerColor,
    headerHorizontalGridLineColor: lineColor,
    headerVerticalGridLineColor: lineColor,
  };

  const defaultRenderer = new TextRenderer({
    font: font,
    textColor: bodyTextColor,
    horizontalAlignment: 'left'
  });


  const floatRenderer = new TextRenderer({
    font: font,
    format: TextRenderer.formatIntlNumber({ missing: '-',
      options: {minimumFractionDigits: 2, maximumFractionDigits: 2 } }),
    textColor: bodyTextColor,
    horizontalAlignment: 'right'
  });

  const integerRenderer = new TextRenderer({
    font: font,
    format: TextRenderer.formatIntlNumber({ missing: '-' }),
    textColor: bodyTextColor,
    horizontalAlignment: 'right'
  });

  const dateRenderer = new TextRenderer({
    font: font,
    textColor: bodyTextColor,
    format: TextRenderer.formatDate({ missing: '-' }),
    horizontalAlignment: 'right'
  });

  const datetimeRenderer = new TextRenderer({
    font: font,
    textColor: bodyTextColor,
    format: TextRenderer.formatTime({ missing: '-' }),
    horizontalAlignment: 'right'
  });

  let rendererMap = new RendererMap({
    body: ({ metadata }) => {
      let { type } = metadata;

      switch (type) {
        case 'integer':
          return integerRenderer;
        case 'float':
          return floatRenderer;
        case 'date':
          return dateRenderer;
        case 'datetime':
          return datetimeRenderer
        case 'boolean':
        default:
          return defaultRenderer;
      }
    }
  }, defaultRenderer);

  const options: DataGrid.IOptions = {
    defaultSizes: defaultSizes,
    style: style,
  }

  let grid = new DataGrid(options);
  grid.cellRenderers = rendererMap;


  let booleanImg = new Image();
  booleanImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEwAACxMBAJqcGAAAA3tpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8eG1wOk1vZGlmeURhdGU+MjAxNi0wMS0wNFQxNDowMTo0NzwveG1wOk1vZGlmeURhdGU+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+QWNvcm4gdmVyc2lvbiA0LjUuNjwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6Q29tcHJlc3Npb24+NTwvdGlmZjpDb21wcmVzc2lvbj4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+NzI8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj4xMjwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+MTI8L2V4aWY6UGl4ZWxZRGltZW5zaW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KsZ876AAAADlJREFUKBVjZICCffv2/Yex0WknJydGmBgTjEEsPRw0sCB71tHREZkLZu/fvx9FbNh5Gt2DKL6FcgB7DQlZf4LW0AAAAABJRU5ErkJggg==';

  let datetimeImg = new Image();
  datetimeImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEwAACxMBAJqcGAAABCRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyI+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDx0aWZmOkNvbXByZXNzaW9uPjU8L3RpZmY6Q29tcHJlc3Npb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjEyPC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT4xPC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj4xMjwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgICAgIDxkYzpzdWJqZWN0PgogICAgICAgICAgICA8cmRmOlNlcS8+CiAgICAgICAgIDwvZGM6c3ViamVjdD4KICAgICAgICAgPHhtcDpNb2RpZnlEYXRlPjIwMTY6MDE6MDQgMTg6MDE6OTc8L3htcDpNb2RpZnlEYXRlPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPlBpeGVsbWF0b3IgMy40LjI8L3htcDpDcmVhdG9yVG9vbD4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CvRzj7oAAADlSURBVCgVzZDNbcJAEIUZx1IKQIqUNADXXELaWB/cAU0guCGKSAmWvFsHJ8TNNIAElGDZzveAtTYdZKS3b3b+Z2yCVFX1gqzMrBiGYQafYF8UxRZ9UEwUw2EhhCt8zrJsCe8JWojBreu697Isu5gwqet6470fq6Q6vqP8YzBKBlzf99+pMerqqDHjX5yDOQmH1Bi7tG37ym6z1KeEhkqf8F4OFjWxhN2+2OP0+D1ejRRo+5Mao/5c3Me/2HTSPM8v6FPtovHUUUXAh3PuDR6Pcm9PJWPuNUkOzEEDAifd/Tkpxn8ov8mWcA140kw1AAAAAElFTkSuQmCC';

  let numericImg = new Image();
  numericImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAALEwAACxMBAJqcGAAABCRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyI+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDx0aWZmOkNvbXByZXNzaW9uPjU8L3RpZmY6Q29tcHJlc3Npb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjEyPC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT4xPC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj4xMjwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgICAgIDxkYzpzdWJqZWN0PgogICAgICAgICAgICA8cmRmOlNlcS8+CiAgICAgICAgIDwvZGM6c3ViamVjdD4KICAgICAgICAgPHhtcDpNb2RpZnlEYXRlPjIwMTY6MDE6MDQgMTQ6MDE6OTM8L3htcDpNb2RpZnlEYXRlPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPlBpeGVsbWF0b3IgMy40LjI8L3htcDpDcmVhdG9yVG9vbD4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CoMNWRkAAACvSURBVCgV1VCxDcIwELRfBjNA+ogBsgo9NAxgyYX3sIehpKNgECRgAAilY+4tF4kh9Jx0uvvXxbqPEID3fhNCONSe5xpUFgP0m6/zQuLlC7YNuABfRZfQm3NuDZ2AlFKdlHKP7Qm+TSllr7XuJskykLX2EWN8Yh7Y44OevTGG9QPjSlyDQwpcgdfZSnh1i8CZK0F37H9WIqJcgyvhHj58tlL+lbjhjtARFGPP8x/gDQp5RsTGUwkuAAAAAElFTkSuQmCC';

  let textImg = new Image();
  textImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAMCAYAAABr5z2BAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAjBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+QWNvcm4gdmVyc2lvbiA0LjUuNjwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8dGlmZjpDb21wcmVzc2lvbj41PC90aWZmOkNvbXByZXNzaW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+NzI8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgrsYyKKAAABLklEQVQoFc2RK0/EQBSFtzN9IcBseARwKCT4FrWChACKTUCwCX8Ag9xVhGR/AgaDa7K2qqGixSFISFAk4JAkm1b0zTdVazbgYJI7995zzp05nXY6f700ZSAMQ90wjEnTNAvEpeu6r3Ecn1OfQfcdx/maZ1QoQtf1fdKhpmk94kJhdV1vqT7LMlP181brIIqiCeI9bnwhbxdFsSmlHAkhhgw+E8twwzzPHyzLuqfeRfdeVdW1DIKgi/1bRD5EBHHM4BP9hjoUJ1fU68QJTlfQHJVluYPmDV4TpmmeQiqbfcAxWa1Bu7MxMCWVaBepLVVzc/sm9GsCYgA4TdN0NUmSLuAj2AGYetCKQ0fUPZzc8GljuA/btj/B7uAk+efFX7JnVb7vL3me97vh2cH/WX8DueJ8SmJmoAkAAAAASUVORK5CYII=';

  let filterIcon = new Image();
  filterIcon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgd2lkdGg9IjE0IiBoZWlnaHQ9IjE0IiBzdHlsZT0idmVydGljYWwtYWxpZ246IC0wLjEyNWVtOy1tcy10cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpOyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0IiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGQ9Ik0xNCAxMnY3Ljg4Yy4wNC4zLS4wNi42Mi0uMjkuODNhLjk5Ni45OTYgMCAwIDEtMS40MSAwbC0yLjAxLTIuMDFhLjk4OS45ODkgMCAwIDEtLjI5LS44M1YxMmgtLjAzTDQuMjEgNC42MmExIDEgMCAwIDEgLjE3LTEuNGMuMTktLjE0LjQtLjIyLjYyLS4yMmgxNGMuMjIgMCAuNDMuMDguNjIuMjJhMSAxIDAgMCAxIC4xNyAxLjRMMTQuMDMgMTJIMTR6IiBmaWxsPSIjNjI2MjYyIi8+PC9zdmc+';

  let filterEmptyIcon = new Image();
  filterEmptyIcon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgd2lkdGg9IjE0IiBoZWlnaHQ9IjE0IiBzdHlsZT0idmVydGljYWwtYWxpZ246IC0wLjEyNWVtOy1tcy10cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpOyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0IiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGQ9Ik0xNSAxOS44OGMuMDQuMy0uMDYuNjItLjI5LjgzYS45OTYuOTk2IDAgMCAxLTEuNDEgMEw5LjI5IDE2LjdhLjk4OS45ODkgMCAwIDEtLjI5LS44M3YtNS4xMkw0LjIxIDQuNjJhMSAxIDAgMCAxIC4xNy0xLjRjLjE5LS4xNC40LS4yMi42Mi0uMjJoMTRjLjIyIDAgLjQzLjA4LjYyLjIyYTEgMSAwIDAgMSAuMTcgMS40TDE1IDEwLjc1djkuMTNNNy4wNCA1TDExIDEwLjA2djUuNTJsMiAydi03LjUzTDE2Ljk2IDVINy4wNHoiIGZpbGw9IiNDRUNFQ0UiLz48L3N2Zz4=';

  let filterRenderer = new TextRenderer({
    font: font,
    textColor: headerTextColor,
    verticalAlignment: 'center',
    icon: ({ value }) => {
      if (value === null) {
        return filterEmptyIcon;
      } else {
        return filterIcon;
      }
    }
  });

  let headerRenderer = new HeaderRenderer({
    font: font,
    headerFont: headerFont,
    textColor: headerTextColor,
    horizontalAlignment: 'center',
    verticalAlignment: 'center',
    icon: ({ row, value, metadata }) => {
      let {type, sort} = metadata;
      sort;
      switch (type) {
        case 'integer':
        case 'float':
          return numericImg;
        case 'date':
        case 'datetime':
          return datetimeImg;
        case 'boolean':
          return booleanImg;
        default:
          return textImg;
      }

      /*switch (sort) {
        case SortOrders.ASC:
          return sortAscImg;
        case SortOrders.DESC:
          return sortDescImg;
      }*/
    }
  }
  );

  grid.cellRenderers.update(
    {'column-header': ({ row }) => {
      if (row === 0) {
        return headerRenderer;
      }
      return filterRenderer;
     }
  });

  grid.resizeRow('column-header', 0, 100);

  grid.dataModel = model;
  BasicKeyHandler;
  //grid.keyHandler = new BasicKeyHandler();
  grid.mouseHandler = new BasicMouseHandler({
    tooltipFormatter: formatMultiTooltip,
    headerRenderer: headerRenderer,
    dataModel: model,
    dataGrid: grid
  });
  grid.selectionModel = new BasicSelectionModel({
    dataModel: model,
    selectionMode: 'row'
  });

  let dock = new DockPanel();
  dock.id = 'dock';

  dock.addWidget(createWrapper(grid, 'DataStats'));

  window.onresize = () => { dock.update(); };

  Widget.attach(dock, document.body);
}

window.onload = main;

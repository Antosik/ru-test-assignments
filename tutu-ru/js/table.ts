interface IDataItem {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    streetAddress: string;
    city: string;
    state: string;
    zip: string;
  };
  description: string;
}

const enum orderDirection {
  asc = "asc",
  desc = "desc",
  none = "none"
}

class DataTable {
  static MAX_ROWS_ON_PAGE = 50;
  private static headings = ["id", "firstName", "lastName", "email", "phone"];

  private data: IDataItem[];
  private filteredData: IDataItem[];
  private page: number;
  private container: Element;
  private sortedBy: Map<string, orderDirection>;
  private filteredBy: Map<string, string>;

  constructor(container: Element, dataSource: string) {
    this.container = container;
    this.page = 0;
    this.sortedBy = new Map(<[string, orderDirection][]>DataTable.headings.map(
      item => [item, orderDirection.none]
    ));
    this.filteredBy = new Map(<[string, string][]>DataTable.headings.map(
      item => [item, ""]
    ));

    this.renderLoading();
    fetch(dataSource)
      .then(response => response.json())
      .then(response => {
        this.data = response;
        this.renderTable();
      });
  }

  // Sort data
  private sortData(parameter: string, order: orderDirection) {
    if (DataTable.headings.indexOf(parameter) === -1) return;

    this.renderLoading();

    if (order === orderDirection.asc) {
      this.data = this.data.sort((a, b) => {
        if (a[parameter] < b[parameter]) return 1;
        if (a[parameter] > b[parameter]) return -1;
        return 0;
      });
    } else if (order === orderDirection.desc) {
      this.data = this.data.sort((a, b) => {
        if (a[parameter] < b[parameter]) return -1;
        if (a[parameter] > b[parameter]) return 1;
        return 0;
      });
    }

    this.page = 0;
    this.sortedBy.set(parameter, order);

    this.renderTable();
  }

  // Filter data
  private filterData(parameter: string, value: string) {
    if (DataTable.headings.indexOf(parameter) === -1) return;

    this.filteredData = this.data.slice(0).filter(
      dataItem =>
        dataItem[parameter]
          .toString()
          .toLowerCase()
          .indexOf(value) >= 0
    );
    this.filteredBy.set(parameter, value);

    this.page = 0;

    this.renderTable();
  }

  private renderLoading() {
    this.container.innerHTML = "";

    const div = document.createElement("div");
    div.setAttribute("class", "loader");
    div.innerText = "Loading...";

    this.container.appendChild(div);
  }

  public renderTable() {
    this.container.innerHTML = "";

    const table = document.createElement("table");
    table.setAttribute("class", "datatable");

    const heading = this.getHeader();
    table.appendChild(heading);

    const tbody = document.createElement("tbody");
    tbody.setAttribute("class", "datatable__body");

    const data =
      Array.from(this.filteredBy.values()).filter(el => Boolean(el)).length > 0
        ? this.filteredData.slice(
            this.page * DataTable.MAX_ROWS_ON_PAGE,
            (this.page + 1) * DataTable.MAX_ROWS_ON_PAGE
          )
        : this.data.slice(
            this.page * DataTable.MAX_ROWS_ON_PAGE,
            (this.page + 1) * DataTable.MAX_ROWS_ON_PAGE
          );

    for (let dataItem of data) {
      const tr = document.createElement("tr");

      for (let heading of DataTable.headings) {
        const td = document.createElement("td");
        td.innerText = dataItem[heading];
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);

    const footer = this.getFooter();
    table.appendChild(footer);

    this.container.appendChild(table);
  }

  private getHeader(): Element {
    const thead = document.createElement("thead");
    thead.setAttribute("class", "datatable__head");

    const headingRow = this.getHeading();
    const filteringRow = this.getFilters();

    thead.appendChild(headingRow);
    thead.appendChild(filteringRow);

    return thead;
  }

  private getHeading(): Element {
    const tr = document.createElement("tr");

    for (let heading of DataTable.headings) {
      const th = document.createElement("th");
      th.innerText = heading;

      const sortState = this.sortedBy.get(heading) || orderDirection.none;
      const sortButton = document.createElement("button");
      sortButton.setAttribute("class", "datatable__sort-button");

      if (sortState === orderDirection.desc) {
        sortButton.innerText = "↓";
        sortButton.setAttribute(
          "aria-label",
          `sort by ${heading} in ascending} order`
        );
        th.setAttribute("aria-sort", `descending`);
      } else if (sortState === orderDirection.asc) {
        sortButton.innerText = "↑";
        sortButton.setAttribute(
          "aria-label",
          `sort by ${heading} in descending} order`
        );
        th.setAttribute("aria-sort", `ascending`);
      } else {
        sortButton.innerText = "↕";
        sortButton.setAttribute(
          "aria-label",
          `sort by ${heading} in ascending} order`
        );
        th.setAttribute("aria-sort", `none `);
      }

      sortButton.addEventListener("click", () => {
        this.sortData(
          heading,
          sortState === orderDirection.asc
            ? orderDirection.desc
            : orderDirection.asc
        );
      });

      th.appendChild(sortButton);

      tr.appendChild(th);
    }

    return tr;
  }

  private getFilters(): Element {
    const tr = document.createElement("tr");

    for (let heading of DataTable.headings) {
      const td = document.createElement("td");

      const input = document.createElement("input");
      input.setAttribute("type", "text");
      input.setAttribute("placeholder", `Filter by ${heading}`);
      input.setAttribute("value", this.filteredBy.get(heading));
      input.addEventListener("input", e => {
        this.filterData(heading, input.value);
      });

      td.appendChild(input);

      tr.appendChild(td);
    }

    return tr;
  }

  private getFooter(): Element {
    const tfoot = document.createElement("tfoot");
    tfoot.setAttribute("class", "datatable__tfoot");

    const row = document.createElement("tr");

    const cell = document.createElement("td");
    cell.setAttribute("colspan", DataTable.headings.length.toString());

    const pagination = this.getPagination();

    cell.appendChild(pagination);

    row.appendChild(cell);

    tfoot.appendChild(row);

    return tfoot;
  }

  private getPagination(): Element {
    const count =
      Array.from(this.filteredBy.values()).filter(el => Boolean(el)).length > 0
        ? Math.ceil(this.filteredData.length / DataTable.MAX_ROWS_ON_PAGE)
        : Math.ceil(this.data.length / DataTable.MAX_ROWS_ON_PAGE);
    const nav = document.createElement("nav");
    nav.setAttribute("class", "datatable__pagination");

    const ul = document.createElement("ul");

    for (let i = 0; i < count; i++) {
      const isCurrentPage = i === this.page;

      const li = document.createElement("li");
      li.setAttribute("class", "datatable__pagination__item");

      const button = document.createElement("button");
      button.setAttribute("type", "button");
      button.setAttribute(
        "aria-label",
        isCurrentPage ? `Page ${i + 1}, current page` : `Go to page ${i + 1}`
      );
      button.setAttribute("aria-current", String(isCurrentPage));
      button.addEventListener("click", () => {
        this.page = i;
        this.renderTable();
      });
      button.innerText = (i + 1).toString();

      li.appendChild(button);

      ul.appendChild(li);
    }

    nav.appendChild(ul);

    return nav;
  }
}

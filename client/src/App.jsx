import React, { Component } from "react";
import * as XLSX from "xlsx";
import { mailSender } from "./services/mailSender";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hoja: "",
      hojas: [],
      file: false,
      newHojas: [],
      listasClientes: [],
      mailSent: ""
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.createClientObj = this.createClientObj.bind(this);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    const this2 = this;
    this.setState({
      [name]: value
    });
    let hojas = [];
    if (name === "file") {
      let reader = new FileReader();
      reader.readAsArrayBuffer(target.files[0]);
      reader.onloadend = e => {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, { type: "array" });

        workbook.SheetNames.forEach(function(sheetName) {
          // Here is your object
          var XL_row_object = XLSX.utils.sheet_to_row_object_array(
            workbook.Sheets[sheetName]
          );
          hojas.push({
            data: XL_row_object,
            sheetName
          });
        });
        //console.log(hojas);
        this2.setState({
          selectedFileDocument: target.files[0],
          hojas
        });
      };
    }
  }

  async createClientObj() {
    try {
      let clientNumb = [...this.state.hojas[5].data];
      let priceList = [...this.state.hojas[0].data];

      //importing all information
      let listZWMD = this.state.hojas[1].data; //Depende de cliente y categoria
      let listZCD8 = this.state.hojas[2].data; //Depende de cliente
      let listZSCKD_ZPYC_ZEPY = this.state.hojas[3].data; //Depende solo de num de cliente
      let listZBDF = this.state.hojas[4].data; // Depende de cliente y de EAN

      let listasClientes = [];

      clientNumb.map(customer => {
        const cliente = customer["Número de Cliente"];
        const ae = customer["AE"];
        const mail = customer["Mail"];
        let listaCliente = priceList.map(producto => {
          return { ...producto };
        });
        listaCliente = listaCliente.map(producto => {
          const cat = producto["CATEGORÍA"];
          const ean = producto["EAN - 13"];

          //calculo ZSCKD, ZPYC y ZEPY
          for (let i = 0; i < listZSCKD_ZPYC_ZEPY.length; i++) {
            if (listZSCKD_ZPYC_ZEPY[i]["Número de Cliente"] === cliente) {
              producto.ZSCKD = listZSCKD_ZPYC_ZEPY[i]["Descuento 2"];
              producto.ZPYC = listZSCKD_ZPYC_ZEPY[i]["Descuento 3"];
              producto.ZEPY = listZSCKD_ZPYC_ZEPY[i]["Descuento 4"];
            }
          }

          //calculo ZCD8
          for (let i = 0; i < listZCD8.length; i++) {
            if (listZCD8[i]["Número de Cliente"] === cliente) {
              producto.ZCD8 = listZCD8[i]["Descuento 1.5"];
            }
          }

          //calculo ZWMD
          for (let i = 0; i < listZWMD.length; i++) {
            if (
              listZWMD[i]["Número de Cliente"] === cliente &&
              listZWMD[i]["Categoría"] === cat
            ) {
              producto.ZWMD = listZWMD[i]["Descuento 1"];
            }
          }

          //calculo ZBDF
          for (let i = 0; i < listZBDF.length; i++) {
            if (
              listZBDF[i]["Número de Cliente"] === cliente &&
              listZBDF[i]["EAN"] === ean
            ) {
              producto.ZBDF = listZBDF[i]["Descuento 5"];
            }
          }
          //calculo Precio Base y Subtotal
          //console.log(producto[" Precio Neto s/IVA PRECIOS POR UNIDAD "]);
          const precioNeto = producto[" Precio Neto s/IVA PRECIOS POR UNIDAD "];
          // console.log(typeof precioNeto);
          const ZCD8 = producto.ZCD8;
          const ZBDF = producto.ZBDF;
          const ZMWD = producto.ZWMD;
          const ZSCKD = producto.ZSCKD;
          const ZPYC = producto.ZPYC;
          const ZEPY = producto.ZEPY;

          const precioBase = precioNeto * (1 - ZCD8 - ZBDF - ZMWD - ZSCKD);
          const subtotal = precioBase * (1 - ZPYC - ZEPY);
          producto.precioBase = precioBase;
          producto.Subtotal = subtotal;
          return producto;
        });
        const listaClienteFinal = {
          priceList: listaCliente,
          customerNumber: cliente,
          ae: ae,
          mail: mail
        };
        return listasClientes.push(listaClienteFinal);
      });
      const mailSent = await mailSender(listasClientes);

      if (mailSent === "success") {
        console.log(mailSent);
        toast("Emails have been successfully sent!", { type: "success" });
      } else {
        toast("There was an error.", { type: "error" });
      }
      this.setState({
        listasClientes
      });
    } catch (error) {
      console.log(error);
    }
  }

  render() {
    const { handleInputChange } = this;
    return (
      <div className="jumbotron" style={{ width: "70vw", margin: "3em auto" }}>
        <div className="title-holder">
          <h1 className="display-4">PG Customer Product List Creator</h1>
          <img
            src="http://images.ctfassets.net/ffeczni4xr4x/7znyJc3Y7SecEoKSYKWoaQ/15a5001dc594c3d5e987e561f82394c5/P_G_Logo_RGB.svg"
            alt="..."
          />
        </div>
        <p className="lead">
          This is a simple sample of a client-based list price creator.
        </p>
        <small>There is no attachment whatsoever with the named company.</small>
        <hr className="my-4" />
        <p>Please upload the needed information and click "Create"</p>

        <input
          required
          type="file"
          name="file"
          id="file"
          onChange={handleInputChange}
          placeholder="Archivo de excel"
        />
        <button onClick={() => this.createClientObj()}>
          Create Client Ojb
        </button>
      </div>
    );
  }
}

export default App;

{
  /* <div className="app">
        <div className="title-holder">
          <h1>PG Customer Product List Creator</h1>
          <img
            src="https://image.winudf.com/v2/image/Y29tLmNhcnRhbXVuZGlkaWdpdGFsLmNhc3Nvd2FyeXBnX3NjcmVlbnNob3RzXzFfNjg4ZDRlMjU/screen-1.jpg?fakeurl=1&type=.jpg"
            alt="..."
          />
        </div>
        <div className="input-handler">
          <input
            required
            type="file"
            name="file"
            id="file"
            onChange={handleInputChange}
            placeholder="Archivo de excel"
          />
          <button onClick={() => this.createClientObj()}>
            Create Client Ojb
          </button>
        </div>
      </div> */
}

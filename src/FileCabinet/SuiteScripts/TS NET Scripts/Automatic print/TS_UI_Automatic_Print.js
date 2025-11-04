/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/log', 'N/render', 'N/file', 'N/record', 'N/search'], (serverWidget, log, render, file, record, search) => {
    const CASH_SALE = 'cashsale';
    const CREDIT_MEMO = 'creditmemo';
    let FOLDER_NS = '';
    const FOLDER = 1566; //SB: 1566 - PR: 1566
    const FOLDER_CM = 29443; //SB: 2090 - PR: 29443
    const TEMPLATE = 17455; //SB: 17455 - PR: 17455
    const TEMPLATE_TICKET = 17456; //SB: 17456 - PR: 17456
    const TEMPLATE_CM = 169797; //SB: 40000 - PR: 169797
    const TEMPLATE_CAMBIO = 5247677; //SB: 3553574  - PR: 5247677
    const TEMPLATE_DESCUENTO = 5247681; //SB: 3553575 - PR: 5247681
    const TEMPLATE_TAX_FREE = 7102766; //SB: 3555270 - PR: 7102766
    const URL_SB = 'https://6785603-sb1.app.netsuite.com/core/media/media.nl?id=83188&c=6785603_SB1&h=HGzPgiCxcHYE32rpKPQcmiQE0YVbqhxBrZ8DMiE_d_D2EsAS&_xt=.js'
    const URL_PR = 'https://6785603.app.netsuite.com/core/media/media.nl?id=17458&c=6785603&h=bVXwt5XcnTy0mmKtgFsPQRTiWWXJNPN95G0gCJVP9rGuZd5U&_xt=.js'
    const onRequest = (context) => {
        try {
            const param_internalid = context.request.parameters.custparam_internalid;
            const param_tranid = context.request.parameters.custparam_tranid;
            const param_printer = context.request.parameters.custparam_printer;
            const param_rectype = context.request.parameters.custparam_rectype;
            const param_location = context.request.parameters.custparam_location;
            const param_date = context.request.parameters.custparam_date;
            const param_total = context.request.parameters.custparam_total;
            log.debug('Params', param_internalid + ' - ' + param_tranid + ' - ' + param_printer + ' - ' + param_rectype + ' - ' + param_location
                + ' - ' + param_date + ' - ' + param_total);
            let impresora = 'POS-80';
            impresora = param_printer;

            const form = serverWidget.createForm({ title: 'Imprimiendo recibo...', hideNavBar: false });
            form.clientScriptFileId = 17457; // PROD:17457/SB:17457 

            let nameFile = param_tranid
            let nameFaileTicket = param_tranid + '-Ticket';

            let TEMPLATE_REC = TEMPLATE;
            let rec_url = "cashsale";
            let label_btn = 'Venta en Efectivo';
            FOLDER_NS = FOLDER;
            if (param_rectype == CREDIT_MEMO) {
                TEMPLATE_REC = TEMPLATE_CM;
                rec_url = "custcred";
                FOLDER_NS = FOLDER_CM;
                label_btn = 'Nota de Crédito';
            }

            const pdfBase64 = createFile(param_internalid, nameFile, TEMPLATE_REC, param_rectype, '', '', 0);
            const pdfBase64Ticket = createFile(param_internalid, nameFaileTicket, TEMPLATE_TICKET, param_rectype, '', '', 0);
            var pdfBase64Cambio = '';
            var pdfBase64Descuento = '';
            var pdfBase64TaxFree = '';

            var ubicacion = [];

            if (param_rectype == CASH_SALE) {
                ubicacion = getUbicacion(param_location);
                let fechaParametro = parseDate(param_date);
                log.error('ubicacion', ubicacion);

                let recordData = record.load({ type: param_rectype, id: param_internalid });
                let isTaxFree = recordData.getValue('custbody_pe_tax_free');

                if (isTaxFree) {
                    let nameFileTaxFree = param_tranid + '-TaxFree';
                    pdfBase64TaxFree = createFile(param_internalid, nameFileTaxFree, TEMPLATE_TAX_FREE, param_rectype, '', '', 0);
                    log.debug('Tax Free PDF generado', nameFileTaxFree);
                }

                if (ubicacion[0] == true) {
                    let fini_cambio = parseDate(ubicacion[1]);
                    let ffin_cambio = parseDate(ubicacion[2]);
                    let nota_cambio = ubicacion[3]
                    let nameFileCambio = param_tranid + '-TicketCambio';
                    let montoParametro = Number(param_total).toFixed(2);
                    if (fini_cambio <= fechaParametro <= ffin_cambio) {
                        pdfBase64Cambio = createFile(param_internalid, nameFileCambio, TEMPLATE_CAMBIO, param_rectype, nota_cambio, '', montoParametro);
                    }
                }

                if (ubicacion[4] == true) {
                    let fini_desc = parseDate(ubicacion[5]);
                    let ffin_desc = parseDate(ubicacion[6]);
                    let monto_min = Number(ubicacion[7]).toFixed(2);
                    let montoParametro = Number(param_total).toFixed(2);
                    let nota_descuento = ubicacion[8];
                    let nameFileDesc = param_tranid + '-TicketDescuento';

                    if ((fini_desc <= fechaParametro <= ffin_desc) && (montoParametro >= monto_min)) {
                        pdfBase64Descuento = createFile(param_internalid, nameFileDesc, TEMPLATE_DESCUENTO, param_rectype, '', nota_descuento, montoParametro);
                    }
                }
            }

            log.debug('pdfBase64Cambio', pdfBase64Cambio);
            log.debug('pdfBase64Descuento', pdfBase64Descuento);
            //log.debug('File', pdfBase64);
            let base64 = contetToBase64();


            let pageHTML = '<!DOCTYPE html>'
            pageHTML += '<html lang="en">'
            pageHTML += '<head>'
            pageHTML += '<meta charset="UTF-8">'
            pageHTML += '<meta http-equiv="X-UA-Compatible" content="IE=edge">'
            pageHTML += '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
            pageHTML += '<title>Connect Print</title>'
            pageHTML += '</head>'
            pageHTML += '<body>'
            //!PR
            pageHTML += '<script src="https://6785603.app.netsuite.com/core/media/media.nl?id=163608&c=6785603&h=69gNJdvbPv4JC5PbY1DClXhz3IFJXBRNdtcWbbMy4sGrVAXm&_xt=.js"></script>'
            pageHTML += '<script src="https://cdnjs.cloudflare.com/ajax/libs/jsrsasign/10.8.6/jsrsasign-all-min.js"></script>'
            pageHTML += '<script src="https://6785603.app.netsuite.com/core/media/media.nl?id=163607&c=6785603&h=5FKEiAzwm6rhp7MMKPaeRV1YtThAsb5gvtXAbXFe0L9lTnBQ&_xt=.js"></script>'
            //!SB
            // pageHTML += '<script src="https://6785603-sb1.app.netsuite.com/core/media/media.nl?id=38375&c=6785603_SB1&h=S89zDpxC_FM3F3Qmlt2vG4DpjPztsEFE8AHXMzqH231MY17o&_xt=.js"></script>'
            // pageHTML += '<script src="https://cdn.rawgit.com/kjur/jsrsasign/c057d3447b194fa0a3fdcea110579454898e093d/jsrsasign-all-min.js"></script>'
            // pageHTML += '<script src="https://6785603-sb1.app.netsuite.com/core/media/media.nl?id=38374&c=6785603_SB1&h=56fl1HFh05Byso6Q9Lfbu79U_MMPjg8VyxXkk0ebO6Kn6XGH&_xt=.js"></script>'
            pageHTML += '<script>'
            pageHTML += 'qz.security.setCertificatePromise(function (resolve, reject) {'
            pageHTML += 'resolve(\'' + base64 + '\');'
            // pageHTML += 'resolve("-----BEGIN CERTIFICATE-----\n" +'
            // pageHTML += '"MIIFEDCCAvigAwIBAgIQNzkyMDIzMDEzMTAxMTE0MTANBgkqhkiG9w0BAQsFADCB\n" +'
            // pageHTML += '"mDELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMRswGQYDVQQKDBJRWiBJbmR1c3Ry\n" +'
            // pageHTML += '"aWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMsIExMQzEZMBcGA1UEAwwQ\n" +'
            // pageHTML += '"cXppbmR1c3RyaWVzLmNvbTEnMCUGCSqGSIb3DQEJARYYc3VwcG9ydEBxemluZHVz\n" +'
            // pageHTML += '"dHJpZXMuY29tMB4XDTIzMDEzMTAxMTE0MVoXDTI0MDEyNTE1NDUyNlowgckxCzAJ\n" +'
            // pageHTML += '"BgNVBAYMAlBFMQ0wCwYDVQQIDARMaW1hMQ0wCwYDVQQHDARMaW1hMSYwJAYDVQQK\n" +'
            // pageHTML += '"DB0yMDI5NTc1NDQ0NCAtIEliZXJvIExpYnJlcmlhczEmMCQGA1UECwwdMjAyOTU3\n" +'
            // pageHTML += '"NTQ0NDQgLSBJYmVybyBMaWJyZXJpYXMxJjAkBgNVBAMMHTIwMjk1NzU0NDQ0IC0g\n" +'
            // pageHTML += '"SWJlcm8gTGlicmVyaWFzMSQwIgYJKoZIhvcNAQkBDBVzaXN0ZW1hc0BpYmVyby5j\n" +'
            // pageHTML += '"b20ucGUwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCPGOIsyor6WZvJ\n" +'
            // pageHTML += '"JbR22LMXHYoDUhgpzaBCTOxa1h/tKMqknepLjk3m7Ot8AYIZRnwZK7bJAAtH4cJq\n" +'
            // pageHTML += '"P+KhCgmrn0G2UjZOoNKQ4kB2We9EREDunjkDa7gSVijPfd3Zj2lhPrCzbp0bebWF\n" +'
            // pageHTML += '"31NcEnnShOK7V4Iz49OasR9paka8YfX58zM/ZgT6t/PpT9lv+gIGGy8A9+Ytt1TU\n" +'
            // pageHTML += '"g4jZEZEmMXElMWFYbEe0oYkHOUBvq1+llt4l2G7uPfMfWd9YBsWaLEVeCO80m2d4\n" +'
            // pageHTML += '"SD5cgtGdGNqe8Zk6fLBWQgOTgrLDPV7OzxEZXBQ71h4OMbcEtt5NbjmWCnP+7/Hi\n" +'
            // pageHTML += '"JsmpKsd3AgMBAAGjIzAhMB8GA1UdIwQYMBaAFJCmULeE1LnqX/IFhBN4ReipdVRc\n" +'
            // pageHTML += '"MA0GCSqGSIb3DQEBCwUAA4ICAQCiFt9jNvnpKJ+fYohyNAom5p6fzrD6Pf66TgIc\n" +'
            // pageHTML += '"oAaylFtjNiSRxQRxV5stq9mqM6fwfbJQWtGxrXwLkTnK24xntK3cyJ5VouImFA4G\n" +'
            // pageHTML += '"2sUYxVdi8UpLnGAoiI7jfydL3I2qfPnoLOaAIhLxrCh1+yZBgP4zG+Fkx0jGlXFC\n" +'
            // pageHTML += '"oShM+VgopevugPeHsr/R6a5x9IVd9zWuCmKmPIe6eSMGPcwhjfLXEAcrcpy/0aYK\n" +'
            // pageHTML += '"xuwXiCeEXIr5clgIpOzzLBe2S2O3S4rB90XDEv9iXk3wUpYMrYcBj75Nr3Kpn8E8\n" +'
            // pageHTML += '"MvmJ8os1KUu0Te2d/aW6IYL3YgBMusbCiUpLOi2yasTTzHi55chw3Yp5tWzyjrid\n" +'
            // pageHTML += '"Eg6qBJ1uxu0jwNtoDIpVi038SFdbG8xN9G9jEZgUt++bHNZKkTMdWHspe6nvk+qo\n" +'
            // pageHTML += '"h4j2wB4qZhBzj/u5zesrSaAYLyr3bALrIVmXORfy/rn+8X6DJRT2k+Vznv+JHMPW\n" +'
            // pageHTML += '"KH577blo2zpNdVpG468mAQm3t4D8C+FI9zitvZByFzmG1zeFP/xYlFypNRXP0QF2\n" +'
            // pageHTML += '"ctzjykl+AOtm6Eh+EYCjnAPmgvL0Pu3bdt97lFQ3SiCJpkJNyARzZpzZK+mUrkdE\n" +'
            // pageHTML += '"xyJXHXFBzEDfTcjvbUzR5sQNjjU2P6KLT/IYXQ9tR67YdFjp1HoE2r1TPuv/EVCT\n" +'
            // pageHTML += '"C/rT4Q==\n" +'
            // pageHTML += '"-----END CERTIFICATE-----\n" +'
            // pageHTML += '"--START INTERMEDIATE CERT--\n" +'
            // pageHTML += '"-----BEGIN CERTIFICATE-----\n" +'
            // pageHTML += '"MIIFEjCCA/qgAwIBAgICEAAwDQYJKoZIhvcNAQELBQAwgawxCzAJBgNVBAYTAlVT\n" +'
            // pageHTML += '"MQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYDVQQKDBJRWiBJ\n" +'
            // pageHTML += '"bmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMsIExMQzEZMBcG\n" +'
            // pageHTML += '"A1UEAwwQcXppbmR1c3RyaWVzLmNvbTEnMCUGCSqGSIb3DQEJARYYc3VwcG9ydEBx\n" +'
            // pageHTML += '"emluZHVzdHJpZXMuY29tMB4XDTE1MDMwMjAwNTAxOFoXDTM1MDMwMjAwNTAxOFow\n" +'
            // pageHTML += '"gZgxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJOWTEbMBkGA1UECgwSUVogSW5kdXN0\n" +'
            // pageHTML += '"cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMxGTAXBgNVBAMM\n" +'
            // pageHTML += '"EHF6aW5kdXN0cmllcy5jb20xJzAlBgkqhkiG9w0BCQEWGHN1cHBvcnRAcXppbmR1\n" +'
            // pageHTML += '"c3RyaWVzLmNvbTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBANTDgNLU\n" +'
            // pageHTML += '"iohl/rQoZ2bTMHVEk1mA020LYhgfWjO0+GsLlbg5SvWVFWkv4ZgffuVRXLHrwz1H\n" +'
            // pageHTML += '"YpMyo+Zh8ksJF9ssJWCwQGO5ciM6dmoryyB0VZHGY1blewdMuxieXP7Kr6XD3GRM\n" +'
            // pageHTML += '"GAhEwTxjUzI3ksuRunX4IcnRXKYkg5pjs4nLEhXtIZWDLiXPUsyUAEq1U1qdL1AH\n" +'
            // pageHTML += '"EtdK/L3zLATnhPB6ZiM+HzNG4aAPynSA38fpeeZ4R0tINMpFThwNgGUsxYKsP9kh\n" +'
            // pageHTML += '"0gxGl8YHL6ZzC7BC8FXIB/0Wteng0+XLAVto56Pyxt7BdxtNVuVNNXgkCi9tMqVX\n" +'
            // pageHTML += '"xOk3oIvODDt0UoQUZ/umUuoMuOLekYUpZVk4utCqXXlB4mVfS5/zWB6nVxFX8Io1\n" +'
            // pageHTML += '"9FOiDLTwZVtBmzmeikzb6o1QLp9F2TAvlf8+DIGDOo0DpPQUtOUyLPCh5hBaDGFE\n" +'
            // pageHTML += '"ZhE56qPCBiQIc4T2klWX/80C5NZnd/tJNxjyUyk7bjdDzhzT10CGRAsqxAnsjvMD\n" +'
            // pageHTML += '"2KcMf3oXN4PNgyfpbfq2ipxJ1u777Gpbzyf0xoKwH9FYigmqfRH2N2pEdiYawKrX\n" +'
            // pageHTML += '"6pyXzGM4cvQ5X1Yxf2x/+xdTLdVaLnZgwrdqwFYmDejGAldXlYDl3jbBHVM1v+uY\n" +'
            // pageHTML += '"5ItGTjk+3vLrxmvGy5XFVG+8fF/xaVfo5TW5AgMBAAGjUDBOMB0GA1UdDgQWBBSQ\n" +'
            // pageHTML += '"plC3hNS56l/yBYQTeEXoqXVUXDAfBgNVHSMEGDAWgBQDRcZNwPqOqQvagw9BpW0S\n" +'
            // pageHTML += '"BkOpXjAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQAJIO8SiNr9jpLQ\n" +'
            // pageHTML += '"eUsFUmbueoxyI5L+P5eV92ceVOJ2tAlBA13vzF1NWlpSlrMmQcVUE/K4D01qtr0k\n" +'
            // pageHTML += '"gDs6LUHvj2XXLpyEogitbBgipkQpwCTJVfC9bWYBwEotC7Y8mVjjEV7uXAT71GKT\n" +'
            // pageHTML += '"x8XlB9maf+BTZGgyoulA5pTYJ++7s/xX9gzSWCa+eXGcjguBtYYXaAjjAqFGRAvu\n" +'
            // pageHTML += '"pz1yrDWcA6H94HeErJKUXBakS0Jm/V33JDuVXY+aZ8EQi2kV82aZbNdXll/R6iGw\n" +'
            // pageHTML += '"2ur4rDErnHsiphBgZB71C5FD4cdfSONTsYxmPmyUb5T+KLUouxZ9B0Wh28ucc1Lp\n" +'
            // pageHTML += '"rbO7BnjW\n" +'
            // pageHTML += '"-----END CERTIFICATE-----");'
            pageHTML += '});'
            pageHTML += 'qz.websocket.connect().then(() => {'
            //pageHTML += 'return qz.printers.find();'
            pageHTML += 'return qz.printers.find(\'' + impresora + '\');'
            pageHTML += '}).then((found) => {'
            //pageHTML += 'console.log(found);'
            pageHTML += 'var config = qz.configs.create(found ,{'
            pageHTML += 'orientation: "portrait",'
            pageHTML += 'scaleContent: false'
            pageHTML += '});'
            pageHTML += 'var data = [{'
            pageHTML += 'type: "pixel",'
            pageHTML += 'format: "pdf",'
            pageHTML += 'flavor: "base64",'
            pageHTML += 'data: \'' + pdfBase64 + '\''
            pageHTML += ' }];'
            pageHTML += 'var data2 = [{'
            pageHTML += 'type: "pixel",'
            pageHTML += 'format: "pdf",'
            pageHTML += 'flavor: "base64",'
            pageHTML += 'data: \'' + pdfBase64Ticket + '\''
            pageHTML += ' }];'
            if (pdfBase64Cambio != '') {
                pageHTML += 'var data3 = [{'
                pageHTML += 'type: "pixel",'
                pageHTML += 'format: "pdf",'
                pageHTML += 'flavor: "base64",'
                pageHTML += 'data: \'' + pdfBase64Cambio + '\''
                pageHTML += ' }];'
            }
            if (pdfBase64Descuento != '') {
                pageHTML += 'var data4 = [{'
                pageHTML += 'type: "pixel",'
                pageHTML += 'format: "pdf",'
                pageHTML += 'flavor: "base64",'
                pageHTML += 'data: \'' + pdfBase64Descuento + '\''
                pageHTML += ' }];'
            }
            if (pdfBase64TaxFree != '') {
                pageHTML += 'var data5 = [{';
                pageHTML += 'type: "pixel",';
                pageHTML += 'format: "pdf",';
                pageHTML += 'flavor: "base64",';
                pageHTML += 'data: \'' + pdfBase64TaxFree + '\'';
                pageHTML += ' }];';
            }
            pageHTML += 'qz.print(config, data);'
            pageHTML += 'qz.print(config, data2);'
            if (pdfBase64Cambio != '') {
                pageHTML += 'qz.print(config, data3);'
            }
            if (pdfBase64Descuento != '') {
                pageHTML += 'qz.print(config, data4);'
            }
            if (pdfBase64TaxFree != '') {
                pageHTML += 'qz.print(config, data5);';
            }
            pageHTML += 'return true;'
            pageHTML += '}).catch((e) => {'
            pageHTML += 'alert("Se presentó un inconveniente con la impresora o no tiene una impresora configurada: " + e);'
            pageHTML += '});'
            pageHTML += '</script>'
            pageHTML += '</body>'
            pageHTML += '</html>'

            //pageHTML += 'sfdsfsfsfssfsf'
            log.debug('pageHTML-onRequest', pageHTML)
            form.addField({
                id: 'custpage_canvas',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            }).defaultValue = pageHTML;
            
            //form.addSubmitButton({ label: 'Save' });
            //form.addButton({ id: 'btnBack', label: 'Regresar a Transacción', functionName: 'funcBack(' + param_internalid + ')' });
            //form.addButton({ id: 'btnNew', label: 'Nueva Venta en Efectivo', functionName: 'funcNew()' });
            form.addButton({ id: 'btnBack', label: 'Regresar a Transacción', functionName: 'funcBack(' + param_internalid + ', "' + rec_url + '")' });
            form.addButton({ id: 'btnNew', label: 'Nueva ' + label_btn, functionName: 'funcNew("' + rec_url + '")' });
            context.response.writePage(form);
        } catch (error) {
            log.error('Error-onRequest', error)
        }
    }


    const createFile = (internalid, name, template, rectype, notacambio, notadescuento, montototal) => {
        //const namefile = name + 'Z' + milisec;
        try {
            const xmlTemplateFile = file.load({ id: template });
            let renderer = render.create();
            let fileContent = xmlTemplateFile.getContents();
            //renderer.addRecord('record', record.load({ type: 'cashsale', id: internalid }));
            renderer.addRecord('record', record.load({ type: rectype, id: internalid }));
            if (notacambio != '') {
                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'notecambio',
                    data: {
                        notacambio: notacambio,
                        montototal: montototal
                    }
                });
            }
            log.error('montototal', montototal);
            if (notadescuento != '') {
                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'notedesc',
                    data: {
                        notadescuento: notadescuento,
                        montototal: montototal
                    }
                });
            }
            renderer.templateContent = fileContent;
            const pdfFile = renderer.renderAsPdf();

            const fileObj = file.create({
                name: name + '.pdf',
                fileType: file.Type.PDF,
                encoding: file.Encoding.UTF_8,
                contents: pdfFile.getContents(),
                folder: FOLDER_NS,
                isOnline: true
            });

            const fileid = fileObj.save();
            let fileObjLoad = file.load({ id: fileid });
            let pdfBase64 = fileObjLoad.getContents();
            return pdfBase64;
        } catch (e) {
            log.error('Error', e);
        }
    }

    const getUbicacion = (param_location) => {
        try {
            var locationSearchObj = search.create({
                type: "location",
                filters:
                    [
                        ["internalid", "anyof", param_location]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_pe_ticket_cambio", label: "TICKET DE CAMBIO" }),
                        search.createColumn({ name: "custrecord_pe_finicio_ticket_cambio", label: "  FECHA DE INICIO - TICKET DE CAMBIO" }),
                        search.createColumn({ name: "custrecord_pe_ffin_ticket_cambio", label: "FECHA FIN - TICKET DE CAMBIO" }),
                        search.createColumn({ name: "custrecord_pe_mensaje_tipo_cambio", label: "MENSAJE - TICKET DE CAMBIO" }),
                        search.createColumn({ name: "custrecord_pe_descuento_promo", label: "DESCUENTO PROMOCIONAL" }),
                        search.createColumn({ name: "custrecord_pe_finicio_ticket_descuento", label: "FECHA DE INICIO - TICKET DE DESCUENTO" }),
                        search.createColumn({ name: "custrecord_pe_ffin_ticket_descuento", label: "FECHA FIN - TICKET DE DESCUENTO" }),
                        search.createColumn({ name: "custrecord_pe_monto_min_ticket_descuento", label: "MONTO MINIMO -  TICKET DE DESCUENTO" }),
                        search.createColumn({ name: "custrecord_pe_mensaje_descuento", label: "MENSAJE - TICKET DE DESCUENTO" })
                    ]
            });
            var savedsearch = locationSearchObj.run().getRange(0, 1);
            var arr = [];
            if (savedsearch.length > 0) {
                locationSearchObj.run().each(function (result) {
                    arr[0] = result.getValue(locationSearchObj.columns[0]);
                    arr[1] = result.getValue(locationSearchObj.columns[1]);
                    arr[2] = result.getValue(locationSearchObj.columns[2]);
                    arr[3] = result.getValue(locationSearchObj.columns[3]);
                    arr[4] = result.getValue(locationSearchObj.columns[4]);
                    arr[5] = result.getValue(locationSearchObj.columns[5]);
                    arr[6] = result.getValue(locationSearchObj.columns[6]);
                    arr[7] = result.getValue(locationSearchObj.columns[7]);
                    arr[8] = result.getValue(locationSearchObj.columns[8]);
                    return true;
                });
            }
            return arr;
        } catch (error) {
            log.error('error getUbicacion', error)
            return [];
        }
    }


    const contetToBase64 = () => {
        // const fileToBase64 = file.create({
        //     name: name + '.txt',
        //     fileType: file.Type.PLAINTEXT,
        //     contents: fileObjLoad.getContents(),
        //     folder: 2114,
        //     isOnline: true
        // });
        // const fileidBase64 = fileToBase64.save();
        const vari = "-----BEGIN CERTIFICATE-----" +
            "MIIFTzCCAzegAwIBAgIQNzkyMDI1MDEyNTE4MTkwMzANBgkqhkiG9w0BAQsFADCB" +
            "mDELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMRswGQYDVQQKDBJRWiBJbmR1c3Ry" +
            "aWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMsIExMQzEZMBcGA1UEAwwQ" +
            "cXppbmR1c3RyaWVzLmNvbTEnMCUGCSqGSIb3DQEJARYYc3VwcG9ydEBxemluZHVz" +
            "dHJpZXMuY29tMB4XDTI1MDEyNTE4MTkwM1oXDTI2MDEyNTE3NTkzM1owggEHMQsw" +
            "CQYDVQQGDAJQRTENMAsGA1UECAwETGltYTENMAsGA1UEBwwETGltYTEmMCQGA1UE" +
            "CgwdMjAyOTU3NTQ0NDQgLSBJYmVybyBMaWJyZXJpYXMxJjAkBgNVBAsMHTIwMjk1" +
            "NzU0NDQ0IC0gSWJlcm8gTGlicmVyaWFzMSYwJAYDVQQDDB0yMDI5NTc1NDQ0NCAt" +
            "IEliZXJvIExpYnJlcmlhczEkMCIGCSqGSIb3DQEJAQwVc2lzdGVtYXNAaWJlcm8u" +
            "Y29tLnBlMTwwOgYDVQQNDDNyZW5ld2FsLW9mLWJhMTMxYjM0MTQ2YzhlZGI3NWRh" +
            "NmMyZTgxMjk3NDU0YTlmOWZmMGMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEK" +
            "AoIBAQCPGOIsyor6WZvJJbR22LMXHYoDUhgpzaBCTOxa1h/tKMqknepLjk3m7Ot8" +
            "AYIZRnwZK7bJAAtH4cJqP+KhCgmrn0G2UjZOoNKQ4kB2We9EREDunjkDa7gSVijP" +
            "fd3Zj2lhPrCzbp0bebWF31NcEnnShOK7V4Iz49OasR9paka8YfX58zM/ZgT6t/Pp" +
            "T9lv+gIGGy8A9+Ytt1TUg4jZEZEmMXElMWFYbEe0oYkHOUBvq1+llt4l2G7uPfMf" +
            "Wd9YBsWaLEVeCO80m2d4SD5cgtGdGNqe8Zk6fLBWQgOTgrLDPV7OzxEZXBQ71h4O" +
            "MbcEtt5NbjmWCnP+7/HiJsmpKsd3AgMBAAGjIzAhMB8GA1UdIwQYMBaAFJCmULeE" +
            "1LnqX/IFhBN4ReipdVRcMA0GCSqGSIb3DQEBCwUAA4ICAQA1gdy8c3fDmGzXK5S4" +
            "+x1obCv3sA0oz4o4t6Zc7Jc6GQosiRmxnxivv7LM/My60vjMOiUIsn4QIdYFg7u2" +
            "6hU2G16nIBr0p31r8pJoYjSLNnlcmEtJ7QaOXudt31mwle/J90paYWHVt+i5iDbh" +
            "tO5qGqESXQ4gCVvEMAOQhG4S+muZ3Pjo/zGdU3d6ET/zMk8L/Gls2nJTF0n6vryp" +
            "w6j5vBEtzof0UrOciIhtl+Rd0yiHZOgmWCXL3EmQEaCDrdhOa6dIKi0e7ffhKYK0" +
            "6EMmvb4QMMa64h8bPYqz8uHBrIn/YJvIpCSyl844TVATR4mZiaapnZ2cSsRTpoBo" +
            "mXmg4G4JXEScQGU9eTQ62JqH4Q19UhAfQ0LufXygpAdXhdDPwGywpCQ4koQXl7+6" +
            "cJIDAP8zas/y/t7w7F5Y0wpJjEDg3CQsChh5iKSsEGtduPSHqbYI+ZoSVCcwyw92" +
            "mVa+iLed+47JkJzBAy9d520lFmF1RDYCG9n44rXZk88cWA4UWIo/qDOyNDBADeih" +
            "8WNQkakDHA2i3/v5gCL7WebgN7XCIYHyDL3R05wEdpYKlf3L7WuTx5ce/gwhrET3" +
            "TgBjSm2AcAh28vIdtFYunx6dLkNk11SVR96SnsFjwrfQPDuyAwRgFZ0sXfMhw23T" +
            "Nc8mo5qEu7zg3F5HuSH6RQ6WlQ==" +
            "-----END CERTIFICATE-----" +
            "--START INTERMEDIATE CERT--" +
            "-----BEGIN CERTIFICATE-----" +
            "MIIFEjCCA/qgAwIBAgICEAAwDQYJKoZIhvcNAQELBQAwgawxCzAJBgNVBAYTAlVT" +
            "MQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYDVQQKDBJRWiBJ" +
            "bmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMsIExMQzEZMBcG" +
            "A1UEAwwQcXppbmR1c3RyaWVzLmNvbTEnMCUGCSqGSIb3DQEJARYYc3VwcG9ydEBx" +
            "emluZHVzdHJpZXMuY29tMB4XDTE1MDMwMjAwNTAxOFoXDTM1MDMwMjAwNTAxOFow" +
            "gZgxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJOWTEbMBkGA1UECgwSUVogSW5kdXN0" +
            "cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMxGTAXBgNVBAMM" +
            "EHF6aW5kdXN0cmllcy5jb20xJzAlBgkqhkiG9w0BCQEWGHN1cHBvcnRAcXppbmR1" +
            "c3RyaWVzLmNvbTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBANTDgNLU" +
            "iohl/rQoZ2bTMHVEk1mA020LYhgfWjO0+GsLlbg5SvWVFWkv4ZgffuVRXLHrwz1H" +
            "YpMyo+Zh8ksJF9ssJWCwQGO5ciM6dmoryyB0VZHGY1blewdMuxieXP7Kr6XD3GRM" +
            "GAhEwTxjUzI3ksuRunX4IcnRXKYkg5pjs4nLEhXtIZWDLiXPUsyUAEq1U1qdL1AH" +
            "EtdK/L3zLATnhPB6ZiM+HzNG4aAPynSA38fpeeZ4R0tINMpFThwNgGUsxYKsP9kh" +
            "0gxGl8YHL6ZzC7BC8FXIB/0Wteng0+XLAVto56Pyxt7BdxtNVuVNNXgkCi9tMqVX" +
            "xOk3oIvODDt0UoQUZ/umUuoMuOLekYUpZVk4utCqXXlB4mVfS5/zWB6nVxFX8Io1" +
            "9FOiDLTwZVtBmzmeikzb6o1QLp9F2TAvlf8+DIGDOo0DpPQUtOUyLPCh5hBaDGFE" +
            "ZhE56qPCBiQIc4T2klWX/80C5NZnd/tJNxjyUyk7bjdDzhzT10CGRAsqxAnsjvMD" +
            "2KcMf3oXN4PNgyfpbfq2ipxJ1u777Gpbzyf0xoKwH9FYigmqfRH2N2pEdiYawKrX" +
            "6pyXzGM4cvQ5X1Yxf2x/+xdTLdVaLnZgwrdqwFYmDejGAldXlYDl3jbBHVM1v+uY" +
            "5ItGTjk+3vLrxmvGy5XFVG+8fF/xaVfo5TW5AgMBAAGjUDBOMB0GA1UdDgQWBBSQ" +
            "plC3hNS56l/yBYQTeEXoqXVUXDAfBgNVHSMEGDAWgBQDRcZNwPqOqQvagw9BpW0S" +
            "BkOpXjAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQAJIO8SiNr9jpLQ" +
            "eUsFUmbueoxyI5L+P5eV92ceVOJ2tAlBA13vzF1NWlpSlrMmQcVUE/K4D01qtr0k" +
            "gDs6LUHvj2XXLpyEogitbBgipkQpwCTJVfC9bWYBwEotC7Y8mVjjEV7uXAT71GKT" +
            "x8XlB9maf+BTZGgyoulA5pTYJ++7s/xX9gzSWCa+eXGcjguBtYYXaAjjAqFGRAvu" +
            "pz1yrDWcA6H94HeErJKUXBakS0Jm/V33JDuVXY+aZ8EQi2kV82aZbNdXll/R6iGw" +
            "2ur4rDErnHsiphBgZB71C5FD4cdfSONTsYxmPmyUb5T+KLUouxZ9B0Wh28ucc1Lp" +
            "rbO7BnjW" +
            "-----END CERTIFICATE-----"



        let base64 = "JVBERi0xLjMKJd/++LIKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlbi1VUykvTmFtZXMgNCAwIFIvTWV0YWRhdGEgNSAwIFI+PgplbmRvYmoK" +
            "MiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbNyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9Qcm9kdWNlcihodHRwOi8vYmZvLm" +
            "NvbS9wcm9kdWN0cy9yZXBvcnQ/dmVyc2lvbj13b3JrLTIwMjAwNjEwVDE1MTgtcjM2ODE5TSkvQ3JlYXRpb25EYXRlKEQ6MjAyMzAxMDMxMjM" +
            "wMjMtMDgnMDAnKS9Nb2REYXRlKEQ6MjAyMzAxMDMxMjMwMjMtMDgnMDAnKT4+CmVuZG9iago0IDAgb2JqCjw8L0Rlc3RzIDYgMCBSPj4KZW5" +
            "kb2JqCjUgMCBvYmoKPDwvVHlwZS9NZXRhZGF0YS9TdWJ0eXBlL1hNTC9MZW5ndGggOTAxPj5zdHJlYW0NCjw/eHBhY2tldCBiZWdpbj0n77u" +
            "/JyBpZD0nVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkJz8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkJ" +
            "GT1hNUCB3b3JrLTIwMjAwNjEwVDE1MTgtcjM2ODE5TSI+PHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLz" +
            "IyLXJkZi1zeW50YXgtbnMjIj48cmRmOkRlc2NyaXB0aW9uIHhtbG5zOnBkZj0iaHR0cDovL25zLmFkb2JlLmNvbS9wZGYvMS4zLyIgcmRmO" +
            "mFib3V0PSIiPjxwZGY6UHJvZHVjZXI+aHR0cDovL2Jmby5jb20vcHJvZHVjdHMvcmVwb3J0P3ZlcnNpb249d29yay0yMDIwMDYxMFQxNTE4" +
            "LXIzNjgxOU08L3BkZjpQcm9kdWNlcj48L3JkZjpEZXNjcmlwdGlvbj48cmRmOkRlc2NyaXB0aW9uIHhtbG5zOnhtcD0iaHR0cDovL25zLmF" +
            "kb2JlLmNvbS94YXAvMS4wLyIgcmRmOmFib3V0PSIiPjx4bXA6Q3JlYXRlRGF0ZT4yMDIzLTAxLTAzVDEyOjMwOjIzLTA4OjAwPC94bXA6Q3" +
            "JlYXRlRGF0ZT48eG1wOk1vZGlmeURhdGU+MjAyMy0wMS0wM1QxMjozMDoyMy0wODowMDwveG1wOk1vZGlmeURhdGU+PHhtcDpNZXRhZGF0Y" +
            "URhdGU+MjAyMy0wMS0wM1QxMjozMDoyMy0wODowMDwveG1wOk1ldGFkYXRhRGF0ZT48L3JkZjpEZXNjcmlwdGlvbj48cmRmOkRlc2NyaXB0" +
            "aW9uIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgcmRmOmFib3V0PSIiPjxkYzpkYXRlPjxyZGY6U2VxPjx" +
            "yZGY6bGk+MjAyMy0wMS0wM1QxMjozMDoyMy0wODowMDwvcmRmOmxpPjwvcmRmOlNlcT48L2RjOmRhdGU+PGRjOmZvcm1hdD5hcHBsaWNhdG" +
            "lvbi9wZGY8L2RjOmZvcm1hdD48L3JkZjpEZXNjcmlwdGlvbj48L3JkZjpSREY+PC94OnhtcG1ldGE+Cjw/eHBhY2tldCBlbmQ9J3InPz4KZ" +
            "W5kc3RyZWFtCmVuZG9iago2IDAgb2JqCjw8L05hbWVzWyhwYWdlMSk4IDAgUl0+PgplbmRvYmoKNyAwIG9iago8PC9UeXBlL1BhZ2UvTWV" +
            "kaWFCb3hbMCAwIDYxMiA3OTJdL1Jlc291cmNlczw8L0NvbG9yU3BhY2U8PC9EZWZhdWx0UkdCIDkgMCBSPj4vUHJvY1NldFsvUERGL1RleH" +
            "QvWE9iamVjdF0vRm9udDw8L1IxIDExIDAgUj4+L1hPYmplY3Q8PC9SMiAxMiAwIFI+Pj4+L0NvbnRlbnRzWzEwIDAgUl0vUGFyZW50IDIgM" +
            "CBSPj4KZW5kb2JqCjggMCBvYmoKPDwvVHlwZS9BY3Rpb24vUy9Hb1RvL0RbNyAwIFIvWFlaIDAgNzkyIDBdPj4KZW5kb2JqCjkgMCBvYmoK" +
            "Wy9DYWxSR0I8PC9HYW1tYVsyLjIgMi4yIDIuMl0vTWF0cml4WzAuNDEyMzg0IDAuMjEyNjQ2IDAuMDE5MzE4IDAuMzU3NTkgMC43MTUxNjQ" +
            "gMC4xMTkxNzEgMC4xODA0OTYgMC4wNzIxODkgMC45NTA1NDZdL1doaXRlUG9pbnRbMC45NTA0NyAxIDEuMDg4ODNdPj5dCmVuZG9iagoxMC" +
            "AwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDE0MDE+PnN0cmVhbQ0KeJzlWcuu4zYM3ecr/APR6P0AirsoOijQrjrIrugic" +
            "ZouiqLoqr9fiiItKrZzM3d2KWYMO7ZEioeHD+nqScM/M/2M9/r05/Tpi5mCCtPpNh2+Px1MVH4y1qjgvJ1O18Ov32lt9Ktcb7+dfjpEr3z2" +
            "07GomE1kI23Q2lm43+DK8Jzg7mGWg/+F3hl+j4I+nw7/HPT0I0D5x3QwhGnUAKFLSruY0zT/dfj0xU4//H34ZcHXZhWSMYtmkBwiXCDZz3A" +
            "HpR40e/gdbFuBhe/+1r77Ot7Q+Fy/v0Vt64L0dAwqum4ULphEuNhUoTjfRKJRrhtbx+P3RN9KB8VlmjO3d3UsjonDEpTJ3qU8nebJAAbJWC" +
            "DXv9PG2si8bubb0eQMX3xsACAQgUAZRlS4yHSeA798oTuBGTLJARmx3GuoEoNZybgNesgluKLfCfo0zLmQDnagl1/NuWHjYnMPgKK30agoJ" +
            "N9lGYMUAx6VEqfktIohlYUyMyGTm3ULTapfz8Lf5OdqZp1TSY4+C50XSHj65sR3fFc5EXElJitrdFiFDZM2dOzxgnepMMIwrtC42P1bsTZX" +
            "lH4MVuUUV9J946AhKci7SDz0bZ34PrQxi32mz0U7kuQqjIVn49pVf+sLfb90HF0RsTB3bBfu+4YdjiHZzvdw5XE9NqxX2UE43LmejUFH3ES" +
            "QSmeQk1DgPDqurr/ORydvvHPkfJTjmyswoK1w+OJks+XkdyiCq9mj10P4GskBlxhWWkXKPgJ0BaEbh7Dfa25C/7N/A/m33mfy95nuSV6tIq" +
            "ho7Up26hnBXIXcRHdN9zPpuNBSnTIpfU15YXZul5rOMJ6L7EodZoRzZiI9jNZA8aTbM8eAoRyx/N66CkVqAm8BWiaNoktfnL2MC18YeFc+K" +
            "PhDrZh6cXtdS6WupXugZ+nTgBO9U7ZPrFoXTn9YuyNvXsnTuVlt/LpjiCIypMvyjmyegEgzA8/PFPjmNa5lXA9DJI9ULRuRwRW7olc5xjzZ" +
            "Nnx+dO0r4vjmvGA5Pb+H9PmBUBkFHB1oAbmXBBan4h28NatcKfdt+iAJfE2vSVyHNvy8ZDwn8+U6TKX/nwlr19Xq7dz3ChclRcgXFtruMXq" +
            "cFfXhzDVjv5tlqiXiNhaxlgmiKjGHabuyMurUVNmkUnGdE9WxXEU4RsRw6MFyMiOFuAnBpVhORqE2u1ouFwmbhmp3NCEqoFkBSODBuBfcZy" +
            "2OB7+PZQKrJVfiosdqLKtNy7sBdqJFC1CpykarXHB3abtmGrd0FOM0T2MKj1tEQchn6Mtc9Yd75SBcJRkkJwGHCevciycmLE/hKXYBjNVXI" +
            "vuOYmq9h21l2F5ADMrlLBfgSBl/acrCnjK5J37G4mcVPgcrp65Z1oEPKpK7GkxGeSwy0kpu+G0YktEHrFtlNT1Uu0eL+bilc4OzWoKZWuwJ" +
            "cQ/XsoWBXSRm1pGdzEwvmMkjNxThntAJC+IdnNxqhzausfUbLFsUUncjm4idImJcVmCWUOSo0UNIHsWkMjrGiAc08Ivl3LfzTpyQLE1KnQI" +
            "5Mtv7pnbeJh53Sdx987thI0Tvxy0zjYm9q+cxQxfF4HVuHWl9r91PrVP5XlTyCaY4HOKDE3LrN1BpIc//DGzKo8smIIjqsXNCypuRoGyRe5" +
            "YsfMURwOkg6CFlr/YXTx4JLNEoclrfm+x328K6+wB1nOBvgnIyRWZ9d/bV/s5QP2tT/9gAmzLnbHSYU1A3ZMflMPRCB7j1qoS7NkLWy9NGW" +
            "B7y4qbYN4IuB8C2HSDX+XxE6mmc3Fy3w9Y2rv42ViS7tjALe8Ldg9e3bl37K8qRfFxJY7IMUOSFEyhJZ/JWRZPDiUN7G0RGGwlAAX3Htc+n" +
            "w39RDEu+CmVuZHN0cmVhbQplbmRvYmoKMTEgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTAvRGVzY2VuZGFudEZvbnRzWzEzIDA" +
            "gUl0vQmFzZUZvbnQvUkpXVFdWK0x1Y2lkYVNhbnMtVHlwZXdyaXRlci9FbmNvZGluZy9JZGVudGl0eS1IL1RvVW5pY29kZSAxNCAwIFI+Pg" +
            "plbmRvYmoKMTIgMCBvYmoKPDwvVHlwZS9YT2JqZWN0L1N1YnR5cGUvRm9ybS9SZXNvdXJjZXM8PC9Qcm9jU2V0Wy9QREZdL0V4dEdTdGF0Z" +
            "Tw8L1IxIDE1IDAgUj4+Pj4vQkJveFswIDAgODAgODBdL0ZpbHRlci9GbGF0ZURlY29kZS9MZW5ndGggODMxPj5zdHJlYW0NCnicjdhBcpxA" +
            "EETRvU7BCco0DQ1cQ3eQtLfvH2GIoDJ7I37vZM+LGVFZ2aCZp5/pz2eZfv5NH6XEXNf1WCf/tMS+HW0p/uHv1/T9UWrsZy3zCG2xbWVfRug" +
            "Z13tehOmyxNyOs7UBusaxXP9xDNA97n/NA+9aa9y/6jYgt7jfcx+QR9wffrJc1yj1SmBAntGu+Q9c/LbEWuoI3OLOc2HZ5hgMqbUYu/JuSb" +
            "WDnCZRZ0TSk0fZ4rr2beDTtz2eMpFsNa5rX44BmQMl2A1UTeUqI3WViXZVRupEibqfKNU6ks4epVpH0hVBmYni7J2oUuBEkTpRol2iSJ0o0" +
            "bXEPfwyINU8kjrzEKqiJF1RnKjPOg0Mc2LqjyXaAaTKCamaxzJPXZRqHstsHkrdxlCqozx8R6qnDp4oUc+JpDrCMjuCMjvCMDuCUh1B2Q3U" +
            "86JnUqauE1LXiWi3HUh93UgNiOpOhtJ9Qqk+kXSfSLpPKJ97Hl96Hjp1jvrsFgwJpcrEMsuEMsvEMMuEUmVi+UwTofvhw5y2k6QOMYIeO8F" +
            "cTYLaTIJaTIQ5SXA+vnyG0zlD0scMSZcCoEdOMM8NhGoEQBWCnPoA0BkSVG8oGrdBByxGQ1I3AJRuGEjXGqUWA6AXg6C6CNBdBOh4APq+76" +
            "cfGjpJjxJlLg/CvAyCeh1hdoxgdoycqoMws0H4nJPkfE76yYTKSNJlRKmKkXTaAPU6QfWBoGdOv6MWTY/4OHQ95GHFSDoekrrhkeyCJOmCk" +
            "3TkIHVWItTcAXo3CObrBFVwclo2gnm3Jegjg6DWl2AeGbQ/2l79gUpRA1S5yWXQ4HTokcsrBZeTAdYNRn+RUVlRqqwkXVaUzgWkKohQCRJU" +
            "hACdIcEsNUKlDVCvI8yyElRZEeam0Vp41fTdD64aSa8ayG7VSHrVQHqDAHoxCCpvgM6boPIG6LwJZt6UjfL2VziUN0rlTdJ5o1TeJJU3QcV" +
            "IUDEizGET1OsInxhx5I5RX8TiIEHqjEaYRy9BNQyhogGo+YDr5pPfP/4C9VxM0HUA6Da8w64MAPVMTNBZv0Mn+O4cILi8dZJTzu8un4+Iqa" +
            "jg1NN355qCy+0jl9v6zv4DBStI/QplbmRzdHJlYW0KZW5kb2JqCjEzIDAgb2JqCjw8L1R5cGUvRm9udC9EVyAwL0NJRFN5c3RlbUluZm88P" +
            "C9SZWdpc3RyeShBZG9iZSkvT3JkZXJpbmcoSWRlbnRpdHkpL1N1cHBsZW1lbnQgMD4+L1N1YnR5cGUvQ0lERm9udFR5cGUyL0ZvbnREZXNjc" +
            "mlwdG9yIDE2IDAgUi9CYXNlRm9udC9SSldUV1YrTHVjaWRhU2Fucy1UeXBld3JpdGVyL0NJRFRvR0lETWFwL0lkZW50aXR5L1dbM1s2MDJdO" +
            "Fs2MDJdMTEgMTIgNjAyIDE2IDI5IDYwMiAzNiA0NSA2MDIgNDcgNTcgNjAyIDU5WzYwMl02OCA3MyA2MDIgNzUgNzYgNjAyIDc4IDgzIDYwM" +
            "iA4NSA4OCA2MDIgMTA1WzYwMl0xMTZbNjAyXTEyMVs2MDJdMTQxWzYwMl0xNzJbNjAyXTIxNFs2MDJdMjQxWzYwMl1dPj4KZW5kb2JqCjE0I" +
            "DAgb2JqCjw8L0ZpbHRlci9GbGF0ZURlY29kZS9MZW5ndGggODQ0Pj5zdHJlYW0NCnicXZbLbttADEX3/got00VgaWxrNEBgoEg3WfSBpv2Ae" +
            "XBSA41sKM4if1+Jh0qAFkgFXg3Je0kOre39w5eH8XRttj+mc36Ua1NPY5nk5fw6ZWmSPJ3GTeeacspXs/T//Bwvm+3s/Pj2cpXnh7Gem7u7Z" +
            "vtzfvlynd6am8/lnORTs/0+FZlO41Nz8/v+cbYfXy+Xv/Is47Vpm+OxKVLnQF/j5Vt8lmarbrcPZX5/ur7dzj4fJ369XaRxaneQyeciL5eYZ" +
            "Yrjk2zu2vnfsZkftR43Mpb/3ncBt1Q/zu/0fN/pw7XHBewdIO/yXkEP6AElAvaAHlAUHOAwELMmwD3gQR/RKRgAwwI615Mo4Z7UvTtwMpE9L" +
            "dld2+0AcU8HwAwIpeQBB0ABrArugoKZRHlJVNu2A8yAOOSiYOFkQVEhe6ESBRKFgswPtTSKK2QX/EQ1dD1FFhJJgZnThq2d6Vq/tir/iZM2h" +
            "TzZ0yLqmFHS9ys/tehG6bGGlZFagax2ErZibU8rTbWMH03poSlI76mOHLAqFsw8tRKYeZNOIfx+1awWGgRmHp4VZh6elXwenhVmHp7V5hKeF" +
            "bUenhVmHp7VhhWeFWaD01mwkR9oZjKLekYUDYySI/sAz0S+AZ6lYsEz2j2AZ7R8C0/XrVGs7WgY4Bmp0lC5DnAJNqXkCzaCnAyqwXXkC7v14" +
            "qhlGqhE8OtVUWtQv9ZuYSCK+UXeoSiohl02LqrBOa50QEOkusGumFkVtbCONhNm2WJAQ3Tr1VQLDREukXmJTEhkTXRkiKqvC2iI2iO3t5imz" +
            "/LRowjrSI+SWYne2klmKaI2os+0R9sITGRklgr1TDa7zEvSeh4yPFN838ikXVh7W0vUs7MoRbmY2mzzaWtpx0nbXHuWGxmy7T+mIPfsOFhn+" +
            "p6pUoanMcth3X8bQLWoS2Z2MzwzajPMCh0rxCzc4gKzQld2xCya3dnsloGlaFEC78zP7gP5inDStm/Fgpm0+FFrsXkhg9gutg0Ls2qW7UhiC" +
            "nWpZtmOpIJiu8cs2+iWj7okWIvNvEWhSgl91X7GiFKZ+cjJSgXn8Wbp645ffq+Xz4r3j4H8Ok3zd4B+e+gHwPLTfxrl/fPkcr4sXvr3D1tjF" +
            "fYKZW5kc3RyZWFtCmVuZG9iagoxNSAwIG9iago8PC9UeXBlL0V4dEdTdGF0ZS9TQSB0cnVlPj4KZW5kb2JqCjE2IDAgb2JqCjw8L1R5cGUvR" +
            "m9udERlc2NyaXB0b3IvRm9udEJCb3hbMCAtMjA1IDYyNSA5MjhdL0FzY2VudCA3NzAvRGVzY2VudCAyMDUvSXRhbGljQW5nbGUgMC9TdGVtV" +
            "iAwL0NhcEhlaWdodCAwL1hIZWlnaHQgMC9GbGFncyAzNC9Gb250TmFtZS9SSldUV1YrTHVjaWRhU2Fucy1UeXBld3JpdGVyL0ZvbnRGaWxlM" +
            "iAxOCAwIFIvQ0lEU2V0IDE3IDAgUj4+CmVuZG9iagoxNyAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDEzPj5zdHJlYW0NC" +
            "nic+/8fH3gAAO4fHsMKZW5kc3RyZWFtCmVuZG9iagoxOCAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDE0NzUxL0xlbmd0a" +
            "DEgMjIyNDQ+PnN0cmVhbQ0KeJzdvHl8FkXyOFzdczzz3PeV63mSJwcQCIEkEDCShyNIgtyHPGAgEEJIuBOOcClXDASUKBFWPEBFLkWfJIJJc" +
            "MWDsKh4oSCuu6C78VjWrBfCeuTJWz3PJIDr9/vu7vv+8fv8nk7P1HT3dFdVV1VX10wGCADoYR1wMHbMhN59S+euLsSSP2GeXLhg5mLt2NPvA" +
            "ZC+AFx64fKl3seb7hUA+DkAwpA5i4sXVJR7VwOoD2IZFM9fOeeJnG8qsEO8Tr0yt2jm7Ccnzp8CMOgR7K/fXCzQNQrxeH0Wr+PnLlhasb3hk" +
            "fV4fRX7PzN/UeFM1Ru2HIAhr+KYXy6YWbFY3UcaDTDsMLb3Lpy5oGjkyLVL8foNAGnw4kXlS7vlvDUdYJQWgGYtLitaHF30/LsAY24DUD0Kh" +
            "D9LahAx4N/mu+MIjs4zzOa8kppqBTUn8BzFFkj/Db8hiSMA/OD9horJZB/0Uc0n+7yIklJNFciGdyFEIjCL16sJJ7e5+YeVHC+IKkmt0er0B" +
            "qPJbLHa7A6nyx0RGRUd4/HGxvniExKTunXvkdyzV0rv1D5909Iz+vXPHDDwlqxbB2X7Bw8ZOixn+G0jcvNG3j5q9Jix48ZPmDhp8h1TAlOn3" +
            "Zk/fUbBTJhVOLtoTvHcktJ58xcsXLR4SVn50mXLV1SsXLV6zdq77l63fsPGTZX3VG3eUr112733ba+5/4EdtQ/u3PW7h3Y//Mijj+3Z+/gTT" +
            "+57av+Bg4cOP/3MkWefC9bVNzx/9NgLjU3Nx1/8/UsnXn7l1ddOtpz6w+nX33jzzFtvv/Pue3D2/Q/Onf/wwkd//PhPf7546RPgKXIC8pBzA" +
            "mjgLngWjkEH6UMmkJmkgjxA/0Bfp3/mXvbavBHeGG+cN9Gb6h3ofSY2LjYxjsaJccY4c5w9LiIuJi45bkRcQVxRwhvf0I4ONvewF4LQiH2NJ" +
            "wVyX6ewrwvYl9Xr8kZ5vXJfA/6lL3dXX7OxL9LR0fHX8HR0PNUxvWN9x9AOG0DIBPDLx5/sCdd8UvnJTszmS6WXVl7cefGJi1svbr54AODi0" +
            "otLLs642Pti6h+/Np2QJ3sEzIbFN8zxFSUD/AQh8msJ6Px98y8lz8CTsAkq4TvYCX+Fe+A+2AqPwiHYB99CNWyEHfAVtMG9sAs2w5/h7/AYH" +
            "Iav4R/Y0xNwBF6HPyCnZ0Eh1CA+b0IRnIY34B04A2/B29AKc+AsvAvvwXNQDJfhfjgH78MHMBc+hy9hC5RCCcyDBTAfFiKPF8ESpKgMymEZL" +
            "IXlsAI+gwpYBSthNayFNdAIj8PdOLPrYD18AX+DZvgQPoE/wsdoMS7BBbiIM/4CnITn4Si0wAZ4FargNXhKTAa3cBoSWOYHgRv5/zHmL9g5t" +
            "KzjC6yH0AVUmjNoV9r+B74pv47/4Xdzq9BYKmIaK47FXj2YSvizSrtTWH3qf+y+FtMKmIzH5zCvIZNYCUlH+t141xHSiFw6Bi18AnJUB7fCq" +
            "Y5D0ID3FcJZYiQpCLmJFe+5Rs4hBwbJ/d0BL4IW564WjhMP8rMWa66RUMerHa+itjyOs9lKuiE33PAAX4jzsRrbXiDdyB0d32NZH8RmNTSQb" +
            "vzeUHIHDxK2WAwtHWM71nS8jnrmwrFbkPMX8Y7B1MId60jBewZhz5OA9XYPbEOJqkVZ2YftzmL6jMwjbVQMncAxEyAJ+sI0bLkAJe0ZnOGzZ" +
            "BfdTVu5+Xwj38SfDbV27EIs3JCMbfbKI32CknoFriENo8hUUkuC3OPcmY7hHUs7NnZs6tjV8TnaRQmMYMHe0yEfZqAUb0MM3sF0jUSRGHKan" +
            "OYc3HvcD3wUP4df1v5pyNIR6NiEHHVDL8TdD4MR/zzEfhGmvSjj5+TxjHj3RLKVvIjpVWrBeU2iYzGVcPdjX5P5vfze9h9D+zrmgxoceH8+6" +
            "sVc7KUCubAZsaiFR+Ap2I90PoOaE0RqzsEXSMU48iJNxn7+wqVwFdyz3Pfcz7yDTxC/CSWHhoXu7EjoGNcxoeMYsHWCRxwTIVvGbxSMhYCse" +
            "wtRc5agnqxBPb1XnvVHUKsP4igsPY98bYLjON4p1M73UF8uM3qQIh0xIFVG4sDkwRnsRtIxDSbDSABTMSnDtBXTk5j2IdW/Jx+TT0kbuSLLt" +
            "4em0UxMuYj7NFpCF7OZo+2cmovjbuFu40Zyc7hq7lGuifuY+ysPfAw/CNNkfhFfhWmvasIv0UhfSeje0I7Qex2JOIflKJVfgBmlKhLlIhOGI" +
            "YXTkb5ClLlytAir5bQG0zpZolnajxIcpvNZ1P5XkMoWmdIP0TIwCruR3iQLacrFlWA6WSDTs0um6EVyjlxCev6GFLVRngpUhclDeyNdGXQYU" +
            "rWOrqcbkKr9mJ6hDZhO0JP0DKaL9J+cnovF1Icr49Zw67jd3DGumXuF+yt3hd/M72HSy18WQFglvCi0iRbxEdUEVYVqtwQ4Byzd9CN3yev6I" +
            "KazHZVEQPv7ALZphYsc5SLILVAAfyKfQCq5Rv6AfPgSqd2GkhAFawSOlMN4tJLDIRrt9D041/NhD6fhojk18uo+LhastB2tSA8YT0wkCmWnP" +
            "pSPtuQBlR3rbyf/gKvc+3CYq0BJLUab/Dg5hlx9CleDs2hrtsF35BZ/Wlqf1N4pvXom9+jeLSkxId4XF+v1xERHRUa4XU6H3Wa1mE1Gg16n1" +
            "agllci8GgI9c3zDC7zBxIIgn+gbMaIXu/bNxIKZNxQUBL1YNPzmNkFvgdzMe3NLP7ac86uW/nBLf1dLYvJmQVavnt4cnzf41jCft5FMHTcF4" +
            "XuH+QLeYJsMj5JhPlG+0ONFbCze4c1xzR3mDZICb05w+PK51TkFw7C/Oq1mqG9okaZXT6jTaBHUIhQc7ltcR4YPIjJAh+cMrKMg6RGrYJ5vW" +
            "E4w1zeMoRDkEnJmzg6OHTclZ1hkbGygV88gGVromxUE35CgMVluAkPlYYLi0KBKHsZbwsiBrd66ni9Xb2s0wayCZN1s3+yZd04JcjMDbAxzc" +
            "vA237DgbataXb16NpL9E6cE1UMbCUyc0gR5HevqctcNGxbAltVcTnV11c3Ne/UcOX5KLOLjy9nmZQiOnyLjhs2JqzcOz8oYAWFSinw5rKSg1" +
            "BtU+4b45laXFuA0RFQHYfzK2PqIPH9TxyeQl+OtnjjFFxvMjvQFZg6LqrNB9fiVDbl+b+7NNb161pnMYR7WGYwKoNPfCBR11cmQ3JxBiHUnE" +
            "wnDyJeLkx/0FnoRkym+IE3IZIeiTKguzMRm+AsQ5FUJcqag2jSQsVhIMPm81T8ATrGv7aubS2YqJWKC6QdgIBOELmHC+k44mJwc7NGDyYBqK" +
            "E4aYjZIvs7o1XN5cKRvsckbHIksg7FT8KbAwN7I8thYNn9bG/0wCy+C68ZNCV97YVZkPfh7JweCtIDVvNxZY5/EatZ11nTdXuBDQX1edv/sQ" +
            "Smx689oclhz5g4MEsf/Ul0Urh+OulRdPdznHV5dUD2zsWPdLJ/X5KuuGzmyenFOQSfmjR0vb40M+rcF5pKBvdCjRl+JP4veEQdW8EBvuAX2+" +
            "yeqRVEjGtQWdZyYKPZQp7hFh8ZhcFvccY5ERw93yj7HYdfhqH0x+/oeTj+cuW9gs3hUc9TQbGmOO5p4tEdzSov4huYNQ4ulJe6NxDd6tKR04" +
            "5fYGskBvz5iiY5SwnGg7rakHytxpS7xSoT2xKV9wLT4tGk9b3VOM0VPk7JM59s+aAsfPngd/yC7/Wp7dhYmPPdJhXw7SSPWuMTEjPR+/dL6O" +
            "tBYiWJS334Z6Ym+ONFuc5D/pY6/ZdfPJx8at23c2K0TJm4bM2Hb2FunT/NnT5tOg2O3jWeF946+XpggWn78B3fbqEP50w6OHb9/2vRDtxeuW" +
            "l5+113ly1f9snr0wfw7D4ybcHMxGn4SCF3gb0Uf1Awz/LfaNDatzWgzJdNkcSAdKI6kI8XJmsmmQk2haalmmXapcalpl2m/br+hiTaJTUYXm" +
            "K3qaZLJPA0sUiN55gV9kM+1PPy9K3m06cqo9lbIbstuI5YBA/qkknySCDQj3QL97aJI7TaLw8nf2ho6fvw4yWlt+mz9+tbm0AU3UZOd331Ld" +
            "hK1e3PCO6G9b70d2vt2IspUbegCVyHjOcufHaGJ0EYYI0wJNEHsR/uJw+lwcapmqqlEU2JapanQVhhXmQ5pD+kOGY7So2KT1iWp9YijCXG18" +
            "EE9YtoAuZYTTaQ/hFG90nYTqlYHWOw2CqqMfv0sGek0Mam2lQxvPh463trcyjAVk92ha6HS774LzQtdY5iSmW+dITNlTM9SDw+0AWU1xm+gZ" +
            "BIHNE+AXP7UC2ysVtPn0DtrVHtWn1RrRqz9LJdCPbW1bCbOobfeTrrhfbF+EyX3c6Ch3P0E71y1T8aS3QXZWezWWHOsGd0HdJnY1oHASJzFz" +
            "cgdDgb7dRylkwjYCAFCG8kZvx735IRyPOQJXC7fSF6t2+ZKdsuomJFgcGVjzwOqhJTktaaTSD7xEX7zL3Of4n4nJv/ziGoC+gaLUP8KUf+04" +
            "ISF/oj+kqVKFHRVoDeev6Qm6jy3/XxvjnC5rkYSXXdFxjZ/VNto01U8ypztkzp0pb8Hceq1xg+Jk9g/BLMKIauAkEGj+xAcFA8myfIhsfF4S" +
            "MaffFgvxIHZZEnri0dI6osrPfXFUSyhJddC7R0//0Qg1H5ty549W6ofeyyBnCTDyRByKjQw9FKoOZRVSxLJWDKGJIQ+DtWFgqE/Iq+aAPhap" +
            "EUNdx7dKewXKNdIFvo1/D2CQERRkEgjqTiqBh3uNl4ie0AEFdmEjKVkzwsAJmRGrqaZbCDnQSHzCs5Iqyk8M9nI0N7tsuanZcSahYwEc6y9i" +
            "WwNLaNjydZa/u7AqqafDtQiFgfRnb6GWMTAff6eiZGJUTlcTkROZE7UxMiJUSXC7MjZUUsil0TpJY64Jb06KgotXZVJiI5qJLkNMaCLaSQ2v" +
            "0k8P8NGbHlew1t7sM9cTzNZQwo6EWsN8781jFkbQdwAszwVJrNVJVkSJLNYSVRWdSVh3F6/nixBvPv1768YIREVQLFMKpWBqmLtB1d9F2isX" +
            "tln1typjcFdJ+YX75g4fPFoK80/8tU3gReay3dYElOfHT3vaNmCN6vHDN6yYdwRxOsySk+k8A/oBp/5b3tTfdnwlZETjKTK0eB8PobLlYiGd" +
            "9j0Xr3Ga9bpq0Cj4W22KrfAVyXpo86b31KdBx8Z41vsW+f7xsf78nqAjuiayV/BiSwwomyPRf98HXyDu5Pc7s1kC5mpcGDJqCut+YwJS0a1K" +
            "xrO5ie/ixXhP5khGRGJgjUhMSbRmGCNMKMPnKiqJOpYVSVn8JgrOUukrZKI8XwlSHGaShJritZXgsdrykrO6pRUJqzrIR9Z2D/D4UgLG3JfB" +
            "gJhboZ5yYy8KmzrfXGXHyhP3bGrvqVgQENlzrrSXQefPPD+2YGLZh1fu+rCsw+onk2zHl1e2XDfmDVji1eMOzLg1ZqRVUtT/B8tW3l+MYuyL" +
            "UJJniycxn2wHlb4nZXaSv3vuNe072s/017Vqrbpd+sP6zm0drTewmvxdMzCcTyn0h4nFbhHpVTl1wPPg06lMmr0PIVGssmvETRGDs0PNRp6n" +
            "zyfn2X6IKvdmcXYBtnZJibrH6gEUzJvSmZCTvLREmWQNHOa3WcmsWZ6oX0XLWlqaWnfRF4jW/dzu365oxaF30P3ooUzoByIiK8TavzqP5pJn" +
            "ES0nKmRDD2m/qdWyxmMKNt+q17Hc1UOveEtFG4rsea5jdjka79Rp30rFTcie+FdNtGuZnLfdVFneHVJexuTd0T4Slvn5LrMdl7i7SjrKPAfE" +
            "sHGVYLKomZmJiz2+QkZnTMWp0KVjTV7wW4DXxwxHJqz9MmPPkpIo8favyFW4gu1nl4mHRrStGv/Uzx99ZnQutDfz78d+iebjydkK/kP3D12g" +
            "zf90cdsJN6v9d0uqXxRhNdW+XxWnq+KEKKqrHo0Mu6jnnPGvB6qZlIMiWT0UUdu99Yrysr5GRKj0CKLbLu5S1Azk7pFx+ncguhKNCfqE2ITB" +
            "bfqQ4i2eCpJN1tiJcTpEBKd/IckxhRVCUl2PHgNvsrrJjUsqSiruRNX+tXxCZJGnZgg+RrJjgYhXpOI53qQVARlG8LMIfbERGZ0B9FONyVsg" +
            "uPT+nIy0zodFsua0vRXW9Jmr8ledKJszdtVP157mEh7Vz6/ct3QDbmFBx8Sjh3q50Qz/Pe83B4r37nn/h/vJveSGcRAZjT/tP7MhlnBybVP7" +
            "38PLcbrKNk5KCkGuNMf0V0YIOQKAWG+sJpbw68RKnQ/CRpBMggikxfc8qEIS3kmQyMycQzMACbI7nox19hMvLiqKit8Pi5Hn6MMs1WUyMxE4" +
            "R1ErSQWl2GVhqqIW5d85yGS0Z7NrUl99s/l1rnb3yLJ1Nu0fyyuHv1DjY+wCMhenOPRaLddEA994FX/0MKEOYmFfbgBvgHxQ1KH9JkKhamFf" +
            "cpSy/o8BA+RU6o/xuuHS+6EZA9ou6UkVwmCp8qil851eyvu/MsGYshLo+dSEF2/Nurcyw7iyO3b2rl8osmSRbrTdBF5sTbLLgrKQXr3XtGxR" +
            "junMiXaErzmuEoSY8Wp7iF2qyQ9+ZRKiDV6KiHajofuquRK0otLvkkGmASQfFRh5n+GDVOXXZJ9UqfI5lTWiqSkftfdUic5+sa7F/6Aq8Dry" +
            "9eeq9n2VvkDX63NfmLV0p2f06nF85cuXFw4m0usffmBTxurlrTkrjqxeNnrC+a8umTNF2TOQ7kbH7m34Mktlwfsuv32u5eOGbk2C6frQeTpJ" +
            "OQp05vX/VFNTG982tvROvCqKKY3PKoMLgcR+k5laXDk9WAq9AKq0HW1aWMrHiqPzC7UmjbLv2pNLOoM0xymJsBUR9YawvRHVhNgqiNrjaw//" +
            "5bW8IrWkJu0JrwKWMwG6uty8pn7wvvirDIjFYvzeWVJyvE30mev9i98ecmatzb/ePXh0I+PLXt25fqhG5nSGA+l20kuiRqJOvNuJepMqDz0R" +
            "Oi70N4m4a43NxQGJ6HOvIvuiew/8oNQRlUw0B8te5Bobu9X8RoClONE1f0CWvtcqdOdNDFVwKPiu5j+JLuWhLmWinsZukC6cQ52/uWy7GpS0" +
            "KFmtqBmqnDVqfSP3KIhFfxy1RZSSe+RNqsPkgPocr5AT5M/0Av8eZVBo9KoBcrzcy0c5URJw6lUcyy4ZEvq6aIgcIQyx1TFQqZcI53TQOcCw" +
            "XMdaE3n2/Pb2/Mh24m7KWYCETm28JicnSeJIYsCnIZbLB8Xy1ljOR35qYX89N729k+2v0JevCic/imTPBnKp5l0M9Nd5vlNQdztqLup8JN/o" +
            "EOboJ2s3WKpVddqarWP6B/q9XTKUeGo/rL+S8NX7q8iLqf8pP+n4acUm16vSaGLJV10gi7VGb+RpDaSL/0eZ54THevEhOl2tJel0Y/1LDXm9" +
            "Y1PWICeWJ/tP3T57LJQMiVmbphlwPLerjYTs+qkUzgDXIpa0khUjIyKiHJHcaIg8iIVPTHemNgYTkRLa7KaOLFHcvfkbsmc6NJGr+DiuOgVJ" +
            "MnWcwVJ0fcs4qIk5wrQxoi+FSTZlLgCehl6FxG9DkzMPckKS3AP+Sf7eObYvk6m7KpOZwQBH4fy2F9W9CS06D5z16XP10QeWzamfOsgz4TlR" +
            "4OBUbnPrH8pZ+IDA9JvSe+eef+4O+tHV3br3vfSpyOE0wb70fLSgt6j0/ue25z/VGqKlbvF1T1+SfYt093xhp8LjNExpQPvOsH2LHNQ6zei1" +
            "nthrd9TLTTZ6TDJ7I2xVhi4mAqqNh+BvDh3qZQb++JWRb0ZI5U1UTGC/WzRnD4yIiqCIiGCCiVJdLocLruLEzVqrVqn5sRozl0ENj0eIlQxR" +
            "eBSW4vCy77MDLb0M4OXlMj2pv374ZLmtDNDhwyxm5xMR/vzG0/W/e6HccWFM+8IEG77/tdOHZzb0C87q2r46aVVx+Num33HQpJy4CmSNXtOy" +
            "YBj02aMm/HtXaFvnpgwdQTqywaUuUqUOS04YLm/24MieZAjKZKdOPQbwbGRUJDMpUKey6FbQF5G1wa3F85XwgTndwoPik52WGRkouM4nDdJV" +
            "IuciM5qokFjLiI2Dg8mUV8EFt6uEIgkyhYeZ9sLZhtlc5yEkyrvaH2qDWQjCZCkMUUz/3lwS+E778wrOvHVncLpUFWoPhj6eNG88bV3E907b" +
            "xJuJW4kAbeZfIlMxxh/sihMlySVCjh+OiqwRj1diwrwHPcYaIgmT8+rF7Anw5Cre+jqTYSgn6ZsRsIOWpaJGZw02d8K5wtcYfssmtl+mp4RT" +
            "teGEmrb32F7Y7iGo2/G0dUw0p+gktB24JY6PDobmeZpw4P6YSy6iGjkNI0kru5XbGxlqz8bGDUw6+aRr3H3t6fTwvZHcdT2y7Xty3HMUSifJ" +
            "SifUXCXv1ez5bRARSPOnMEUFcXpTRVazlXBqQ1HIDJiQRTDMS/GVqrKjV5z9bq0ykObrrtxygR6zU5e40gUEiwJ6kQnbysCswYPdtFVBFbJ1" +
            "DV9yo4sgS3J8Uw+u6RTjp+gaJrT+JKH7xtyLvT+c3tJ5vuPnGpsuOeD5eu/r+k7piU23RIkpV99Qua90v9Y4P7QH5pfDF170ECusGgK8nOQP" +
            "JvZ/iiem67WaARKtZIkSAtUKjFPT7XMiuleaSKZcKMhyxplkoMQ2VmyRWY8RC5i9uGxtoV6Tp1q/1Q43b6VLvspk55oH8w4cwRHS5BHG++38" +
            "wIFjVYvqnicRaohTHbQkdv9vKRewOHisduvVrbZuu1NZNZNu+wu4ZF9obArxPbZzIVjE3mEBEIHuIrQARKo5ffW1v5cIEtPS8fH3JM4vgUK/" +
            "PFuifBqzXSdlvIVZrVaWqDXe3QzdJd0nC7Ppn0OINf6UBM5e9MmWqFa3liYlQ20YDImigmCSVpBVAZ+BchTtr5/htMh7/gYTmYTm7mWIVvG5" +
            "C0dHBpG1684VVGmPeDo1XftI9yq2l+mhb54bzrid1HZxwnQ2+8iFOdDAInPU1FOUSTxoR9uFGV0YxmQrXDffrGFNuBad4bFFaZjX+XYlxF90" +
            "6w53Bx+ObecX61drXtN/ZrmNf1rhnPcOV4nUIHT8BohgXYX+tGBQon2HlotPEUPC69rT+mM2hyNupHuPCYIvC5Hb2iku/xeigs1x1GdTqslg" +
            "MKiAknH6VHvsFSj1xua6U7cUu55Hgia3ma6C9vsqcO162Jb+0nT+Xw83spU4KQrvOmWZUhe1+VSlan9A2F5lktl4ts/WC6cVJZ2M1vcmXD5C" +
            "Cbz9DYSQYn92uM0dGl/6BMqnP7lGJf3U6Zg/aWCW/yzcJNkr/IPEOgmulX6gl6lgkgJuhuI61yO2iRJjRLPIMqh+eJ4nkph+Zco1aB4IMUv3" +
            "FZDCFFxPML1t6n0pg+Wt7tOmj7IZyezxdlJgXOACjfDJqQgmUXP5ACAjDdTCsS5tpmOoo8fa3+OE07/vJuf81Mmv+DnHSjfg9C+1CoxtUf9o" +
            "2pJrbBbtVu7W7/bvMO6w3mQ7Kf7+YPCftVB6aBmv9a0kW7jt0kbNQelA5oXTC/YvpC+1Gj6S5YKkdNVgNpYysJwpVyua82N6+W/hN+KWPiti" +
            "IXfilj4rYiF34pY+K2Ihd+KWPit6IbwG9vjC14WfIuVjwk3heBCV0Kf4iZLS3TEE/o0dOVgff3BA/V1CeQYmUAmkqOhkaFnQkdCebUkkwwit" +
            "5L+oddDr4VeDZ1G+luVlVGH9C/1d2tWNxtpL0m70WAAhzNs2c2lqjy3U8e0QLYIrod+Y2UMryVtytJoD/tOVovNgvZajauinTOvICbJgEuj6" +
            "FjRufbjytjlBUGsz2wOb3SY49NKHt9wZ/XvQqdDX9Ws/vax/O4zZp4UTpsjXn3sb6Ff2oO09b2qKn+Une34B4VO8F/hHFogBg76c2qFWvXD2" +
            "lr7w86HI2ujD4gHpIPqA9qDuoMG/Tpxm7RNt87AD5LYy1gmt9XidWzkoyo0HK92l+rzvFZcPTy/nju27hOUpHC8Kk0mMsUWIxgjte4iEo3OD" +
            "NgFPDiN7iIuQhdVRGIkPNhEB7o6BjwYTbILqMymPJ0kMTFJ1TWl6Bfglo5FWJWJ5UtrWuYOCX0f+kSeWS3xVj5/9E+/xNcfCM9u6ETmuiIiz" +
            "/Ak8nzo9tDhP4cq71rRl1uHE/v69Ylm/GnEOW6Q9/EueMof0yQ1Wc6YuR6SVqebq9bYUAvVOpPehW6QfqOpkfb06wxarUZS48laiqvCar99O" +
            "/MpIlyGLiFwbz9zXQjcYbfC1T4AXULUSFNWe3itvR7PdiHLopDlCfZEs2RdQRwcHiwq0wqQ1DbBuYJAsknxkBWhCHvEssUJiwWTikZS/G5jy" +
            "co68tbXoXn1c59+dsCaHSuF06Mbiud9ObV9FF3ZXsXpX9mQM2cAWqF9qNv5KBdJ8Kb/9hGaETFUiBKind4k71R9qVQUtZxW66r1O031VDdEI" +
            "mrO5ohhBinGY4uJ8XhiNGhUHRVmjqtIUMtXEbbnVKVxed0jGsmIF9DnyO2m7C9GyUGCUe2tskFipDsHVBlSkg1IOnSGNxkHUnzxzmitiRddC" +
            "UKC0xSxAvh41QoSpUPIbUS9QP9/BUTqo1dAVLROy3aFXTvfzlBB/ww+HM1MSkCHWQ4bhN0R3M06HU6B8Y2PjUvcR/jjE3eMCoY+fWzQoAuXD" +
            "1+4cHjM2kHJPZYQ3dOrQt+EOobsi3ttefaa4ffduXNCILBi9xdZT0/oXTRg6IABA7dOeX55889W5KEbZadJ3mlm+nHBms5zaBH28oRvJAdfE" +
            "FULyF5shPBRmivtONMZ5WFuQn7YKsiPSWTPgIohK783ZBXSa2t/OoO3PYTzMwD7dsESv+V5S4uF6qwkXdIQKjKnALnsV+vyImipK9d93Qe6w" +
            "aJmyZrYjXMa9EY9FflEh9PutDmtTl5UmdQriGChKF96cQVwTjyEjU6yvPmyppmVvT/qNduB+eKS2I4r46GW21ZMWPnUM+aoT5sv3uWPtupwf" +
            "esRvHf4jh+49365fe+4TSfvHjxl4MKpzCcwIHdeQwpEKPYPXM7dw33BccPpFqgUD8IBsRFeEE/DH8QPcReuxZ03z8+xCILIUTrXQghQnm29R" +
            "ZAE3GzXi4XA9txEhXvu9na2rCl77PCxc58di0sx/lEIGd4lu8mTB0NsRcvmX/kpE/HRKvhocS2bu4mv1tAMmsHdRobT4fwd5A7NHdpi1QoWi" +
            "RComgeBk1ScpBU1VK0VqVo9V+JwUeYEUaudA4INQGDRAURXix6aBJJWLQocIgxSnr7TO1z/SPgpVr7p83yUevYYi0lt+FgljEpJrlp7sirFx" +
            "ayAEX+d0YIwGajdaNq+D2X+DQ3igpdDqeTy5dDG0CJ6hX7Q/iHt3j7kl6t0evsTzIpt7mjjH+MnQzL0g2t+20bpJH+O5zz+dG6KBInp8TYzb" +
            "jey/faUFM4ccKnSA1x8oHt3TqvtWRgd00jW+Y2Q5E8qSFqctD1JSMrLtDeSQX5tnzIQiZjbf8MznQG/cLyPebrMkqHlD0exzAO6gn5DeqS5f" +
            "bwpIkGvM+iMOk6M9cZ5qZjG95kKJrd2KomM8vXwTEVMe0t98qGvkD4VdJHmqcSbHD8VUlUp+crSjtrNFLxHj+TOkJYlox+h/Uh6OZ9Be5aTf" +
            "j1x1ydbAQgHyOW4YEZ6fFqaEiCIY0+HmAlAtUeJDu+VnfJm2hyOFKKMc0NnPzOp5hRJ+nmVMzpuUp/bDi9Z//T0DyenRosmXbcIa7JlVnrWX" +
            "P8tZ1+bMWPwlo0Thxyo3Pd+/uA8d7QtPutQSnR++t35oQGZmXazVbPcm/EpsawoGj43i83KkY4v+EIxGewQB3/3T3pQRzapD+kO6Q9FXtCd1" +
            "583fBQpRfndJo9f8nSXrDbB7YiLokKNRMCzSVKBxh0waaPKtHnxQArtf6HzPPwMfhHPAV/AL+Y5PtfXdun6Y6Qud6MNl+RsU+uvgrExETFqI" +
            "5sTKkYYo/JJjBoPkTp3PkRrPPmKz9HJaG+sqIoVPeWCVxVXDrFxonCd0XILk9nltLjLeZfZUQ5Oh8XaVc8k2IlmQ5UmRxPtJtl8JCb5VNauR" +
            "044L0dadLoRdaXNH6zKfnbmqAfydAl9cqqGLNi3oXDYwdE6sX/IeqasLHTx29D3T06cckugikTm5Z1qO/vsrIWoyU8iX8egtNthgb/7Ie6Qi" +
            "sZJWrveqtFL+gAyzkqtAarVPgp5TlOZUSBCrqP46Rse+cohGuSMfOjikMtg4VQWzpQPBhUezLw1H4yiPv+GRzCiL+yUKIuKLED9+THPPRv6M" +
            "PRHkkQczzz3yubnX//jS9sbfFkkg3Aoof3Tn8r5yystl4YyibgbMc8ISwTR+hfBU+qnNPsjTxlOGU+ZTjlPuc54343UPKImHr9HiPLr3d0lk" +
            "1mPYgHEbqY1ghXcAT0KhmeToDXPs0KhzWj32Hvbs+1j7DPs4t32Pfbn7CfsvD0vPqoMJJOUKvklHiQi5fp2He6UFVmJlzDfpPUmafm1vIg6F" +
            "qGiYowYlQ/ouaGoqDz5EKl2/0peTAYXenflArpz5cTpMJq6pKFTnDg+lvOU814+rpzExnH0BnHKly13f5/8yCbD1F9+08SZloQyxCV2cblff" +
            "24xSkx9aVNYYu4fqdO1tKDIzH9KFpkzZeUk7jui2zfxjgHTasm5H89xKXl5J79+79nCBcj3e5HvebLERMNDfv+D9o/N9Ih4RPN0VKPmpajXL" +
            "OctqnTJbnU61qI3KkQGtCprQNC6Wozz2LvkeR7HPFOLR+otUSk3ZkOnKLWHH18rDz/CAWAlfpLgjhYtFpGJkSlC55pKojQOZJ9ZhTLl1kdOR" +
            "b84UjZ0BE0cciLsvSTIQU4vZKQD8sBsj5UNFokN6wyflx5x+46RobdDbcT9Zcs37VG61sf2vNQeSXVbS5f8LtksOezklm+/JhO/Dp3Mfm/v7" +
            "aQp6rHNB5QdZ504DP2Vu/yx8ZKeMwY0xEnXcg67nec5ETROB+huA5u7UAB0WDr8aqAzKKW5ERuaSGFXgIO5Lqbl5/M/yHIx/4XNoYk9t1cCD" +
            "hEmq6i2WM1WKrLoHxVNals+WEVjPnt2z0KZsreTkS7PsaxCLIZpZ/4PeZFF8h3eD17cu/2B+7YNj42mqvYfuftry1eOKF2f/EjaLVHjpm2u/" +
            "WUR8yyOIT1xqEURsNHvQ+vp8Emy1XSg1Ywwakyb9XlR/DwaUUggN7L4cFd0qFWxkFmyyIdxVtu1Og0aRYvZaraZOdGuNk0lZp1jqoJzWIKdL" +
            "lHlEh3lglPlLgeX+0aDmNZl7eR1xmfuWnzMx9DKDXltwcOTekS2aO3OvOSxtePFZLRtC5fPTVs5rd1N6wbd7onzlMxvH8jWC/bfL0iXAGoYW" +
            "yepGslWv04tErpWniRJzQrUKvFRAoWCgF7mBL+6N93DJkpT3IQS1CmYbFrCizTzMi9e9zTNXEaanWaylz0uXuMO1/78qpB+7Rrj6Tnk6T4cW" +
            "wNP+ouFUq5UXMWtEjdz1eLj6lfVZ9WfcZ+otaAmaao06TWhRfwjf178O9/Ofy+pOYGg+3afINrQgUNnaJ2oQqeRBe4FdKZ4USOpNKKg5gVek" +
            "FgAXF0IUIDkak3n89uzzme+/kHmR+F4C3stDSF3b5fs1/EnVSaBndAxWpIPS/KHTqkvEAlZEmA8Zy5SLDGfayGnz4Um0IjQ1RCIyb+grxtyt" +
            "j/NQrRKZE/haYZfLXMSQMM1Uq1fC7xQqESvmkkdeRuub9pMrTc56GY6NpRPS4RdtT+ew/b5yKvlaE2SoN7vKVOXaTapN2nOR55P+GvkXxO+i" +
            "/wuQUMjaYI7nuPYSw1/8tt87k0GlYqISTHRNqsAmu0WYmkkd/l1zHTfbV9nf8cu2Bvp7+pvAw8rN2jm9Y7Ojr47el30O9FCNNa8cBs3j25PJ" +
            "Ims2umFVDmQzF4qqYG9wMLyGujG+Jmf1br8Sr6rtT2fndrCj6cYKZ/LL47JkZ+wtKKRVd7qk2U2LLHXofwjen32kiHDSyR993UjM/N7HdHFm" +
            "VLKexwxxJmTl3bnB51ZUr5iwdTq7LLqXz7jrKNTIx/Ibx9Kvy7JiL53VntOl54in9ywwR/n8avsPomvsW9inHAbNMbNurxIpMrN1DTiN9U0u" +
            "03RUsmm0aq1tOtBk00yTiUmrf1mLcUNnugU7OWCQ3ShW+IS+Bv8wy66/y0tRfJ+W0dLcCUpQZpYTGyrf+Bh/WHzftt+xwlyQqhT1Wnr9HXml" +
            "6wvOU/Z9LvoLg3tL1kCokoXAK2x7OXwe2hlXK7rwKUbQvD/GgHLZxGwfBYBy2cRsHwWActnEbB8FgHLZxGw/F9HwOLCywZ7KeTGVzRpydXQV" +
            "aK5ijl09er2PXvvu2/vHje5pb2dDAydam8PtdReajl56dLJlktIXUNomUwd81j/4s97UEsqJfk1xciPItEhcRtxFtFXtVh5N2dFb9XO13jC8" +
            "xkwasGATocmL946j9pRxb0klfjRBcr1FYepXSIHqVs7SZZdj7CbarnZ8ZAMOq0eZzvCwBxViTmqWuaoqn/DURXEWIE5qqLsqN4442HXxORym" +
            "pmjapIdVbPlJkfV2ikTN/ipTrP5Rke14deOqu66nxpaJrx+k5taG7qP7u5yVIGQdBY3R35aYPHz0X6VQct2YVq+xiAzDTS6RtLmdwSZYNhQF" +
            "SyFJBVVOggc5Fobyc66p6+bpOt8y267gsIik2c2mgTRJBjKBaNoLgeTWSCd5Md2ybvZlxEWdJKOxAw7cf+UJbUpCUXHJ6OQF691h848rFm2v" +
            "P1WprHHUbo9iG83+L1/qFaaHD3JtzNhn1nIk4iGc3hcGq12ncdr83i8Xo9Ww3OugEXFBZK08pUY6fiLuDk+r0fkZuOjkNtdUWklANTWalYiQ" +
            "O3/UwQo3Z3Im93myKnAJ4pTiRSHh2j0liDChC6UkMBNBZVPPZXExUrqKEPMVIiO0evk+bwxGKS82aBES5OSOgNBjk6n3elw4h+LoPnijn92o" +
            "Oq+ON/y95cMHfr+Bf99D772+JI1MdFTftyZkd72xfGe9YXzs1PifYk58bcNL9lyROfbe8v4Qd1jPDF3pOcML9h6Cnm2AXk2WjCiN1Lh970hE" +
            "J+kr9GY1GuNGjEiABoXbkVMWBultxTqUlUEV/Xtfq1H3VtN1bmRXc5k2Lk6n3VefoojP8fpdFE4p81qtzqsnU/dnZxlKrpVrqkQNn7hB8QsP" +
            "iO7V2myQ9W53eVH11b/Y2pGXOhbYjxFPg15bO5uZVmrV5KIO/o+WkF1tZcv17Z/UJRp87rlZ4RBpCZK/i/ALf4kj9+uYjZb5TaIVIOWW8vNc" +
            "9NCQrYzrzgSLTga7u9ueppo6txVdKEv2TqtdtiGM9sNzHbDb9luntlu8ivbbfaF9wcyjWmdtPXrb+ajUKKHvrZg9822++dXzyxeNje94k76R" +
            "fuY7Ntj4ryl8+mpjo5wnAS9gTgYJv9X8L1DALTHKPQfKMakkeQMwDbMY9gktzkfbjOZtSEgqjm+s428CshtxofbuMP9uCI4tdwGdb9M4LgU+" +
            "Y3nQf6IW+FWMhJGkmkwjcyDeWQ1rCYaP9m9Dpop82nH1dM8oZk8SmZ0BvIge1REW4T8WroVPZ2yixdD3wqc/I6L7NXIb9IIkOK3dfqHYa8wT" +
            "0VzxS5vsLXrgehN7ozsAcr+H/z374Ozf8uCk18sWyXMMGb9AFpJ/k+tJ0uWjmbn56f0Xd3REbpTANV8vFQr/4CNR9Wx0FgAkf2v6CfC9X/M7" +
            "vx9LypF/NnOTNrwfA1zOuYLSrkLy89hDiBci3kf5snhMjirnEdiXoS5CfNBzJfD18SA5ycwv455L+YHlb7OhfvoyqzPPMw6pY85mDcoODB8R" +
            "iljH8Hcgvkw5ouYpyvlgzC3KudGpT835ocwMxxMmLWYvZgLcfwXlfGOKOMz2p/E82aljMF3Y75X6X815mNKHbs+p8D5SnkJ5gaFZsa74wr+Q" +
            "QUnndJ2kjIG8gdlQeafPL5OyXMUmjtpekhp/1v5SQW/G/ORX+VO3H6dg7/KLQpPGG9/xvyRMkdrMZ9Q+hqk8KkM86jrfINbFV7fOJ99FX48g" +
            "zkV8zDMUZjblMzmro+S54bplWWvs89WBWY8WoZ5G+Z5Sl0nrwYpc9hH4Qe7vhbON8mYW+G7V7k/CeumhbM8r6sV+tuUe67dMM6FG84XfoO/g" +
            "27ID92QsY5EKXlU+ExFPL+D+WvMvTDvD5fLsnpckQeWFyu4TlL40BCmg9yBOQXzAPY/3AqOPRQZWvQb/8Mt/y8qIWSykspIDXmZJtISeonby" +
            "v2Vn8D/U8gRvhYfEFtuTCqf6rKUL72iBvVA9UH1JY1HswjTg1q7tlR7WXe77k/6KfqfDN0MWwzvGd4zZv86mTSmY7jHf8cy2nLMcswaZy3Ad" +
            "MZ61VZtu2IvdGgxFTranbOd7/+/ps9+M13rTC71v5n6/x+Xpv9XaZVrlWyyv4fbQQVjABcTMIEVMtHWf6l6VPkiRzfyeZetXwXQtR44YJUCU" +
            "7y7RoE56A67OhcCiMEtbhgWQAcXFVjEfcplBVbBQOhgX/zgRfYOKBmgwDz0JDkyrGJYkSUKzMrXy7Aa775CjigwgZ70cQWmYKBvKTAH4+nHC" +
            "sxDFtdLgQVwcSUKLEIPrrNPFSzlnpZhDcOH9ygwjssny7CW4cPfocCsvFiGdXL7HQrMyvfIMHumZODfVGBW/pEMW7HcIggKjOWCU4ZtrB9hq" +
            "AKz8jEyHC2Xr1ZgVl7FYMkhlzcoMCs/wWCdjL/wdwVm5ddkWMZT9Ckwlou9D3n74C7OO6SkuGj+ohXeRO+IRfMXFJV7cxcWpnjHzlya4h1WV" +
            "J7i7Zs5oGd639QU7+D5873jS4rnLi33ji8qLypbXjQ7xSt3ktpL7mniysVF3gmL5i9bWrJoYXnPcEe/ddftywpLZs/0Tpi5sFy+aUVZydKis" +
            "vFFxcvmzyz77UqvUjvQOyRxxEAZ8/+94eSisnJEw9snpV//cEvWsNf1huHCg96Scu9Mb1lRcUk5FhbN9i4tmzm7aMHMsnneRXN+mzmwEE1lG" +
            "SyAmTAflWiZ/GmI2XjlhQl4XAjlCE2ElbAYimAFtiyBpQiVYe1SuZ61LcPjf3LvISzvAwMw9UFoiPzv7UU4/iJs5YVEzCMQno9YFcl95GJfh" +
            "ZCC0Fjsd6kMDZPrGMQ+RzAAekI6QqlyyWC8dz6ex8s9z8U7yuUrdgcbfzkeZ8str2OSCr1uwKkTa0YJw4R99oR9dILR1PMmjP7dsf4T/rC7i" +
            "7H9fJm3/8md3l/dO1DmbyLyc+ANPP//0uNkubRc4QbrMwX6Qf+b+uzssddv9nhjy2exhxJ5bIZJmTwSuw63ZJzzIlyGtbPxaoGMwTwsWwRz/" +
            "iPJGf1fSvn1+9idJf/lvf/tmPPx+r/Vyf9cK///wPf/xvuUDzZ1ZGLrf900MucDFMeBx0VZxAVYwk2nBrToMOjBAEZ0ScxgQbfEhm6DA5zgA" +
            "jdEQCREQTQ6GB4cNxY39D6IhwSU4STohi5ID0hGS9MLZbc32qY+aNvS0MJlyLrG7N1AuAWy4FYYBNnyZ3GGwFC0iTkwHG5DHciFPBiJVI5Cq" +
            "seg1RyHWjwBqZuE+nsHTIEATIVpcCfkw3SYAQVIP/tYDdOxObIVK4FS1DOmR2x9WAxLZJ1filxjH3+qQC6tkj/3shbugrvlzz5tgI3yx6rug" +
            "SrYDFugGrbCNrgX7oPt6FrdDw/ADqiFB2EnOle/I5Rw8DA8Ao/CY7AH9sLj8AQ8Cfvkj/AcIDza5cPwtPwxnmfhOQhCHdRDg/z5KPYhKfbRn" +
            "GY4Di8SCV6CE+iivQKvEgFOyp+X+QOchtfhDXhT+dTVO/JnrtjHrc7BefgQLsBHRJQ/TfVndOguwSfwKbTCZ/Al/A2dur/LH9ViH9H6Fr7Du" +
            "b0CP8BVooLfCxNKihfMpGNLhGFF85fONCwuKitZNLuwaKG81IoLZhaWLVqoLp+zdO7KxXOLFvI5y8oWHTM1k5OFZk8jzW9YYPa800wy4RLJ9" +
            "FspFJuKFxdzULz4cE3x3uJgsdBI5zdI/TxPNZJ+9YLnqSbSr+PlesFxoZGU13MedmpQcY6ljaS+YaQgn+vxPNhE8snb7XEoF44boAnkJ5RGD" +
            "zs3WHlHcSOpa8gMn/16BGD4cJRYi1ny/56OgL+Sf6Ck/o78o14P6sHxtJwuQVnw0CrlvJ6uls+rlPMaejc74xiFdDeer5BNZAZKpIN8jRCHk" +
            "usgbWRT/f4oRxP5OwLrHQh8gUCJBYFWBArNjkY6r/4ll6eJ7qS76u2evYPVdBcEMb+M+RO6E3iytf58vGewlVRBqTxQpTLgerKJLkVBdZCVE" +
            "JBLlmOf97kcjEuBYBKeR9ef93sGG8nt2JQ1GImYbUJNcZARCA2XuTS8PjDG00h8bJRG4qkPLPK8hOiXmq7hLQ4UUoUEEu68iQDZ5NdVOR2X8" +
            "YYvzhd4zjUxRBqKHS3nG+luv8ZTf36Rpw5z8MXwsFBLNjXsjXTc10g2vXAxwbEFb9z8e6VuHdnEbWmoddwVeFG+Xs3K6z2LNjVyb9QfcMzt7" +
            "GMODv9hvKOJVmNnsz2zNzXSZL+hwDEz8EM/x52BUKZjWqCR3TkpfFIbG+mieiIZX6KLcLYWwSLMHN1Sb5jtQSavpGXyLFaEz+Sf9Zvu8fyef" +
            "AubaDKaAgf5soH12Ug+b2ADDNaQu7uqKsLspg/Ub5rtaSa5WEEbAo6XA41cqOGioyqMwMbwaW1gsE8m4GX6ELyL+RPMHLxDa+ES5q8xd2Dm4" +
            "QTdgaXsxW8jHj2Ye2POxjwG8wy645g4yaP2qGsaaYZ/tKrmQ1XNHlVNtaqmUlWzQlVTpKopUNXkq2qmqmruUMVLcZJXipGipAjJJTkkm2SRT" +
            "JJB0kkaSZJEiZeoBJKLEomikUw9QSejTb8DtYDACnYk5cvKRwZfLoSRs7zBqxN8jUQzbmpQ8A0hQctIGDlxiKsJG3VU3utYnu3KtoycMKUJb" +
            "B2f+HuwtcHmkDeWoomdRJ4deRk2UXak4QVkkHnA8GG/cSi4EQwk/+vPdQNMRo5deQKnbwcuOB6yUT76j6k8X6o85Sq5xcgJ2KBGblAjN6hhD" +
            "Wq+VNUoDVzRwZ2If/BwdCDYlwEd0YGRwXsmeO9Ems7TETnDmugIdgpMaeKy4XzOeFbOZQ8LBEY2khfldiijN7XTvEc2sXZkk+Y91i74tNyM5" +
            "oWb5SrN+CSax5rRPD7phmao33nYDMrYSW4GhfKohUqz4+FmC2gua1bKTqzZVlggN1vAb5Wb+VizukAgZ1jdpgBrUvdoABvUBR6Vcae7r9dPl" +
            "+ubdDwE5C4COv5f2lT8Zpty/MGvZqh8evl0kvzv/spvviwakpzcBK+QzLo1W9n3nQp8OUWYC4Jbl891BdfN8nqbYA3JVD79lFgwq3AuO88sa" +
            "iSZvqJhwTW+Yd66V7b+a31wK6t+xTesDrbmTJxSt9VfNKz+Ff8rOb6ZwwINxYcPXLppuC2dw9UdOPwbnR1mnR1gYxVf+o3qS6y6mI11iY11i" +
            "Y1V7C+WxyI5JROGoOROqZNgSGDoneFzA9VqLEOnFETGBoY4TIsHBfGi6ZZY112RzTyQg6BNDgR1viFBPWZW1Wtwr8GsCvWLVRnYN7uUKtddt" +
            "8RGNpODSpUJi82oujdPSflSZPyy/wcFhFV7CmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDE5CjAwMDAwMDAwMDAgNjU1MzUgZg0KMDAwMDAwM" +
            "DAxNSAwMDAwMCBuDQowMDAwMDAwMDk5IDAwMDAwIG4NCjAwMDAwMDAxNTAgMDAwMDAgbg0KMDAwMDAwMDMxNyAwMDAwMCBuDQowMDAwMDAwM" +
            "zQ5IDAwMDAwIG4NCjAwMDAwMDEzMjUgMDAwMDAgbg0KMDAwMDAwMTM2NSAwMDAwMCBuDQowMDAwMDAxNTYxIDAwMDAwIG4NCjAwMDAwMDE2M" +
            "jEgMDAwMDAgbg0KMDAwMDAwMTc4NyAwMDAwMCBuDQowMDAwMDAzMjU4IDAwMDAwIG4NCjAwMDAwMDM0MDIgMDAwMDAgbg0KMDAwMDAwNDM5N" +
            "iAwMDAwMCBuDQowMDAwMDA0NzU5IDAwMDAwIG4NCjAwMDAwMDU2NzIgMDAwMDAgbg0KMDAwMDAwNTcxNiAwMDAwMCBuDQowMDAwMDA1OTI3I" +
            "DAwMDAwIG4NCjAwMDAwMDYwMDggMDAwMDAgbg0KdHJhaWxlcgo8PC9Sb290IDEgMCBSL0luZm8gMyAwIFIvSURbPDJjMTQyYTlkMDAwMDM3N" +
            "DgzOTk0MTQyOWU1MGVjOTQ1PjxmNTgyNTZlMDAwMDBmMDg4YmRhMThiZDAxZThjZWY1ZT5dL1NpemUgMTk+PgpzdGFydHhyZWYKMjA4NDQKJSVFT0YK"

        return vari;
    }

    function parseDate(dateStr) {
        var parts = dateStr.split('/');
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }

    return {
        onRequest: onRequest
    }
});
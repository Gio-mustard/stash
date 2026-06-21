# Reglas de Ingreso de Dinero

En la aplicación **Stash**, ingresar dinero (un "Ingreso") se comporta de tres maneras distintas según el **contexto** y la procedencia de los fondos:

---

## 1. Ingreso General (A tu Billetera disponible)
* **Descripción:** Dinero externo que entra a tu cuenta (como tu sueldo, un pago externo, etc.).
* **Acción:** Nueva Transacción ➡️ Seleccionar **Ingreso** ➡️ Guardadito: **Ninguno**.
* **Efecto Contable:**
  * Sube el saldo disponible de tu billetera (`portfolios.balance`).
  * Sube tu saldo total general en la app.
  * Ningún guardadito se ve afectado.

---

## 2. Ahorrar en un Guardadito (Traslado de fondos)
* **Descripción:** No es dinero "nuevo", sino dinero de tu billetera disponible que decides apartar a una meta de ahorro (depósito rápido o monto inicial al crearlo).
* **Acción:** Botón **"Depositar"** en un guardadito ➡️ Ingresar monto ➡️ Confirmar.
* **Efecto Contable:**
  * **Baja** el saldo de tu billetera disponible (`portfolios.balance`).
  * **Sube** el saldo del guardadito seleccionado.
  * El **saldo total general** (Billetera + Guardaditos) **se mantiene igual** porque es un traspaso interno.

---

## 3. Ingreso directo a un Guardadito (Ingreso etiquetado)
* **Descripción:** Dinero externo nuevo que decides destinar directamente a una meta de ahorro sin pasar por la billetera disponible.
* **Acción:** Nueva Transacción ➡️ Seleccionar **Ingreso** ➡️ Seleccionar **Guardadito**.
* **Efecto Contable:**
  * **Sube** el saldo del guardadito.
  * **Sube** tu saldo total general.
  * Tu billetera disponible (`portfolios.balance`) **no cambia**.

---

## Resumen de Impacto en Balances

| Acción | Billetera (`portfolios.balance`) | Guardaditos | Pockets | Balance Total |
| :--- | :---: | :---: | :---: | :---: |
| **Ingreso General** |  **+** Aumenta | ➖ Sin cambio | ➖ Sin cambio | **+** Aumenta |
| **Ahorrar / Depósito Rápido** | **-** Disminuye | **+** Aumenta | ➖ Sin cambio | ➖ Sin cambio (Traslado) |
| **Ingreso directo a Guardadito** | ➖ Sin cambio | **+** Aumenta | ➖ Sin cambio | **+** Aumenta |

---

# Reglas de Pockets (Tarjetas Virtuales)

Los **Pockets** representan dinero real externo del usuario (cuentas bancarias, tarjetas, efectivo físico, etc.). A diferencia de los guardaditos, los pockets **no descuentan de la billetera** al crearse — su saldo inicial es dinero **externo** que entra a la app.

---

## 4. Crear Pocket con Saldo Inicial
* **Descripción:** Registrar una cuenta/tarjeta con dinero que el usuario ya tiene fuera de la app.
* **Efecto Contable:**
  * **Sube** el saldo del Pocket creado.
  * **Sube** el balance total general (es dinero externo nuevo).
  * Billetera y guardaditos **no cambian**.

---

## 5. Ingreso en un Pocket
* **Descripción:** Dinero externo nuevo que el usuario recibe en esa cuenta/tarjeta.
* **Efecto Contable:**
  * **Sube** el saldo del Pocket.
  * **Sube** el balance total general.
  * Billetera **no cambia**.

---

## 6. Gasto desde un Pocket
* **Descripción:** El usuario gasta directamente de esa cuenta/tarjeta.
* **Validación:** No se puede gastar más de lo que tiene el Pocket.
* **Efecto Contable:**
  * **Baja** el saldo del Pocket.
  * **Baja** el balance total general.
  * Billetera **no cambia**.

---

## 7. Transferir de Pocket → Billetera
* **Descripción:** Mover dinero del pocket al saldo disponible general.
* **Efecto Contable:**
  * **Baja** el saldo del Pocket.
  * **Sube** `portfolios.balance`.
  * Balance total **no cambia** (traslado interno).

---

## 8. Transferir de Pocket → Guardadito
* **Descripción:** Ahorrar dinero directamente del pocket a una meta de ahorro.
* **Efecto Contable:**
  * **Baja** el saldo del Pocket.
  * **Sube** el saldo del Guardadito destino.
  * Billetera **no cambia**.
  * Balance total **no cambia** (traslado interno).

---

## Fórmula de Balance Total

```
totalBalance = portfolios.balance + SUM(guardaditos.current) + SUM(pockets.balance)
```

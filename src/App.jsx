import { useEffect, useState } from "react";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(localStorage.getItem("login") === "yes");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState(JSON.parse(localStorage.getItem("items") || "[]"));
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    qty: "",
    buyPrice: "",
    sellPrice: "",
    ship: "",
    place: "Qua tay",
    online: false,
    shipped: false,
    sold: false,
    note: "",
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("items", JSON.stringify(items));
  }, [items]);

  const yen = (n) => Number(n || 0).toLocaleString("ja-JP") + "円";

  const login = () => {
    if (id === "admin" && password === "123456") {
      localStorage.setItem("login", "yes");
      setLoggedIn(true);
    } else {
      alert("Sai ID hoặc mật khẩu");
    }
  };

  const logout = () => {
    localStorage.removeItem("login");
    setLoggedIn(false);
  };

  const getPlatformFee = (place, sellPrice, qty) => {
    const revenue = Number(sellPrice || 0) * Number(qty || 0);
    if (place === "Mercari") return revenue * 0.1;
    if (place === "Yahoo") return revenue * 0.05;
    if (place === "SNKRDUNK") return revenue * 0.08;
    return 0;
  };

  const calcProfit = (x) => {
    if (!x.sold) return 0;
    return x.qty * x.sellPrice - x.qty * x.buyPrice - x.platformFee - x.ship;
  };

  const resetForm = () => {
    setForm({
      name: "",
      qty: "",
      buyPrice: "",
      sellPrice: "",
      ship: "",
      place: "Qua tay",
      online: false,
      shipped: false,
      sold: false,
      note: "",
    });
    setEditingId(null);
  };

  const addItem = () => {
    if (!form.name) return alert("Nhập tên hàng");

    const platformFee = getPlatformFee(form.place, form.sellPrice, form.qty);

    const newItem = {
      id: editingId || Date.now(),
      date: selectedDate,
      name: form.name,
      qty: Number(form.qty || 0),
      buyPrice: Number(form.buyPrice || 0),
      sellPrice: Number(form.sellPrice || 0),
      ship: Number(form.ship || 0),
      place: form.place,
      online: form.online,
      shipped: form.shipped,
      sold: form.sold,
      note: form.note,
      platformFee,
    };

    if (editingId) {
      setItems(items.map((x) => (x.id === editingId ? newItem : x)));
    } else {
      setItems([newItem, ...items]);
    }

    resetForm();
  };

  const editItem = (item) => {
    setSelectedDate(item.date);
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      qty: item.qty || "",
      buyPrice: item.buyPrice || "",
      sellPrice: item.sellPrice || "",
      ship: item.ship || "",
      place: item.place || "Qua tay",
      online: item.online || false,
      shipped: item.shipped || false,
      sold: item.sold || false,
      note: item.note || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteItem = (itemId) => {
    if (confirm("Bạn muốn xóa dòng này?")) {
      setItems(items.filter((x) => x.id !== itemId));
    }
  };

  const moveDay = (num) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + num);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const todayItems = items.filter((x) => x.date === selectedDate);
  const monthItems = items.filter((x) => x.date.slice(0, 7) === selectedDate.slice(0, 7));
  const yearItems = items.filter((x) => x.date.slice(0, 4) === selectedDate.slice(0, 4));
  const waitingShip = items.filter((x) => x.online && !x.shipped);

  const makeSummary = (arr) => {
    const buy = arr.reduce((s, x) => s + x.qty * x.buyPrice, 0);
    const sell = arr.reduce((s, x) => s + (x.sold ? x.qty * x.sellPrice : 0), 0);
    const fee = arr.reduce((s, x) => s + (x.sold ? x.platformFee : 0), 0);
    const ship = arr.reduce((s, x) => s + (x.sold ? x.ship : 0), 0);
    const profit = arr.reduce((s, x) => s + calcProfit(x), 0);
    return { buy, sell, fee, ship, profit };
  };

  const daySum = makeSummary(todayItems);
  const monthSum = makeSummary(monthItems);
  const yearSum = makeSummary(yearItems);

  const year = Number(selectedDate.slice(0, 4));
  const month = Number(selectedDate.slice(5, 7));
  const daysInMonth = new Date(year, month, 0).getDate();

  const layout = getStyles(isMobile);

  if (!loggedIn) {
    return (
      <div style={layout.loginPage}>
        <h1 style={layout.loginLogo}>LTtenbai</h1>

        <div style={layout.loginCard}>
          <h2>Đăng nhập</h2>

          <input style={layout.input} placeholder="ID" value={id} onChange={(e) => setId(e.target.value)} />

          <input
            style={layout.input}
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={layout.button} onClick={login}>Đăng nhập</button>
          <p style={layout.gray}>ID: admin / Mật khẩu: 123456</p>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div style={layout.sidebarInner}>
      <h2 style={{ color: "#00ff99", marginTop: 0 }}>Bảng chọn</h2>

      {isMobile && (
        <button style={layout.redButton} onClick={() => setMenuOpen(false)}>
          Đóng
        </button>
      )}

      <div style={layout.cardMini}>
        <h3>Chọn ngày</h3>
        <input style={layout.input} type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />

        <div style={layout.grid}>
          <button style={layout.grayButton} onClick={() => moveDay(-1)}>← Trước</button>
          <button style={layout.grayButton} onClick={() => moveDay(1)}>Sau →</button>
        </div>
      </div>

      <div style={layout.cardMini}>
        <h3>Mua online chưa ship</h3>
        <p>Số món: {waitingShip.length}</p>

        {waitingShip.length === 0 && (
          <p style={layout.gray}>Không có hàng đang chờ ship</p>
        )}

        {waitingShip.map((x) => (
          <div key={x.id} style={layout.waitingItem}>
            <b>{x.name}</b>
            <div>SL: {x.qty}</div>
            <div>Ngày mua: {x.date}</div>
            <div>Giá mua: {yen(x.buyPrice)}</div>
          </div>
        ))}
      </div>

      <div style={layout.cardMini}>
        <h3>Lịch tháng</h3>

        <input
          style={layout.input}
          type="month"
          value={selectedDate.slice(0, 7)}
          onChange={(e) => setSelectedDate(e.target.value + "-01")}
        />

        <div style={layout.calendar}>
          {[...Array(daysInMonth)].map((_, i) => {
            const day = String(i + 1).padStart(2, "0");
            const date = selectedDate.slice(0, 8) + day;
            const hasData = items.some((x) => x.date === date);

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                style={{
                  ...layout.day,
                  background: selectedDate === date ? "#00ff99" : hasData ? "#17382c" : "#050505",
                  color: selectedDate === date ? "#000" : "#fff",
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <Summary title="Tổng ngày" data={daySum} yen={yen} layout={layout} />
      <Summary title="Tổng tháng" data={monthSum} yen={yen} layout={layout} />
      <Summary title="Tổng năm" data={yearSum} yen={yen} layout={layout} />
    </div>
  );

  return (
    <div style={layout.app}>
      {isMobile && menuOpen && <div style={layout.overlay} onClick={() => setMenuOpen(false)} />}

      {isMobile ? (
        <div style={{ ...layout.mobileSideMenu, left: menuOpen ? 0 : -295 }}>
          {sidebar}
        </div>
      ) : (
        <div style={layout.desktopSideMenu}>{sidebar}</div>
      )}

      <main style={layout.main}>
        <div style={layout.header}>
          {isMobile && (
            <button style={layout.menuButton} onClick={() => setMenuOpen(true)}>
              ☰
            </button>
          )}

          <h1 style={layout.logoSmall}>LTtenbai</h1>

          <button style={layout.logoutSmall} onClick={logout}>
            Thoát
          </button>
        </div>

        <div style={layout.card}>
          <h2>{editingId ? "Chỉnh sửa" : "Nhập sản phẩm"}</h2>
          <p style={layout.gray}>Ngày: {selectedDate}</p>

          <input
            style={layout.input}
            placeholder="Tên hàng"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div style={layout.grid}>
            <input
              style={layout.input}
              type="number"
              placeholder="SL"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
            />

            <input
              style={layout.input}
              type="number"
              placeholder="Giá mua"
              value={form.buyPrice}
              onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
            />
          </div>

          <div style={layout.grid}>
            <input
              style={layout.input}
              type="number"
              placeholder="Giá bán"
              value={form.sellPrice}
              onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
            />

            <input
              style={layout.input}
              type="number"
              placeholder="Ship"
              value={form.ship}
              onChange={(e) => setForm({ ...form, ship: e.target.value })}
            />
          </div>

          <select style={layout.input} value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })}>
            <option>Qua tay</option>
            <option>Mercari</option>
            <option>Yahoo</option>
            <option>SNKRDUNK</option>
          </select>

          <label style={layout.checkRow}>
            <input
              type="checkbox"
              checked={form.online}
              onChange={(e) => setForm({ ...form, online: e.target.checked })}
            />
            Mua online
          </label>

          <label style={layout.checkRow}>
            <input
              type="checkbox"
              checked={form.shipped}
              onChange={(e) => setForm({ ...form, shipped: e.target.checked })}
            />
            Đã ship về nhà
          </label>

          <label style={layout.checkRow}>
            <input
              type="checkbox"
              checked={form.sold}
              onChange={(e) => setForm({ ...form, sold: e.target.checked })}
            />
            Đã bán
          </label>

          <input
            style={layout.input}
            placeholder="Ghi chú"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />

          <button style={layout.button} onClick={addItem}>
            {editingId ? "Cập nhật" : "Thêm vào bảng"}
          </button>

          {editingId && (
            <button style={layout.grayButton} onClick={resetForm}>
              Hủy chỉnh sửa
            </button>
          )}
        </div>

        <div style={layout.card}>
          <h2>Bảng sản phẩm</h2>
          <p style={layout.gray}>Ngày: {selectedDate}</p>

          <div style={layout.tableWrap}>
            <table style={layout.table}>
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>SL</th>
                  <th>Mua</th>
                  <th>Bán</th>
                  <th>Kênh</th>
                  <th>Phí</th>
                  <th>Ship</th>
                  <th>Online</th>
                  <th>Đã ship</th>
                  <th>Sold</th>
                  <th>Note</th>
                  <th>Lãi</th>
                  <th>Sửa/Xóa</th>
                </tr>
              </thead>

              <tbody>
                {todayItems.map((x) => {
                  const profit = calcProfit(x);

                  return (
                    <tr key={x.id}>
                      <td>{x.name}</td>
                      <td>{x.qty}</td>
                      <td>{yen(x.buyPrice)}</td>
                      <td>{yen(x.sellPrice)}</td>
                      <td>{x.place}</td>
                      <td>{yen(x.platformFee)}</td>
                      <td>{yen(x.ship)}</td>
                      <td>{x.online ? "✅" : "⬜"}</td>
                      <td>{x.shipped ? "✅" : "⬜"}</td>
                      <td>{x.sold ? "✅" : "⬜"}</td>
                      <td>{x.note}</td>
                      <td style={{ color: profit >= 0 ? "#00ff99" : "#ff4444" }}>{yen(profit)}</td>
                      <td>
                        <button style={layout.smallGreen} onClick={() => editItem(x)}>Sửa</button>
                        <button style={layout.smallRed} onClick={() => deleteItem(x.id)}>Xóa</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {todayItems.length === 0 && <p style={layout.gray}>Ngày này chưa có dữ liệu</p>}
        </div>
      </main>
    </div>
  );
}

function Summary({ title, data, yen, layout }) {
  return (
    <div style={layout.cardMini}>
      <h3>{title}</h3>
      <p>Mua: {yen(data.buy)}</p>
      <p>Bán: {yen(data.sell)}</p>
      <p>Phí: {yen(data.fee)}</p>
      <p>Ship: {yen(data.ship)}</p>
      <h3 style={{ color: data.profit >= 0 ? "#00ff99" : "#ff4444" }}>
        Lãi/Lỗ: {yen(data.profit)}
      </h3>
    </div>
  );
}

function getStyles(isMobile) {
  return {
    app: {
      background: "#000",
      minHeight: "100vh",
      color: "#fff",
      fontFamily: "Arial, sans-serif",
      fontSize: isMobile ? 14 : 15,
      display: isMobile ? "block" : "grid",
      gridTemplateColumns: isMobile ? "1fr" : "330px 1fr",
    },

    loginPage: {
      background: "#000",
      minHeight: "100vh",
      color: "#fff",
      padding: isMobile ? 14 : 40,
      fontFamily: "Arial, sans-serif",
    },

    loginLogo: {
      color: "#00ff99",
      textAlign: "center",
      fontSize: isMobile ? 38 : 56,
    },

    loginCard: {
      background: "#111",
      padding: isMobile ? 16 : 28,
      borderRadius: 18,
      maxWidth: 420,
      margin: "auto",
    },

    main: {
      padding: isMobile ? 8 : 22,
      maxWidth: isMobile ? "100%" : 1180,
      width: "100%",
      margin: "0 auto",
      boxSizing: "border-box",
    },

    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: isMobile ? 10 : 18,
    },

    logoSmall: {
      color: "#00ff99",
      fontSize: isMobile ? 22 : 34,
      margin: 0,
    },

    desktopSideMenu: {
      background: "#080808",
      minHeight: "100vh",
      borderRight: "1px solid #333",
      padding: 14,
      boxSizing: "border-box",
      position: "sticky",
      top: 0,
      height: "100vh",
      overflowY: "auto",
    },

    mobileSideMenu: {
      position: "fixed",
      top: 0,
      width: 280,
      height: "100vh",
      background: "#080808",
      zIndex: 20,
      padding: 10,
      overflowY: "auto",
      transition: "0.25s",
      borderRight: "1px solid #333",
      boxSizing: "border-box",
    },

    sidebarInner: {},

    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.65)",
      zIndex: 10,
    },

    card: {
      background: "#111",
      padding: isMobile ? 12 : 20,
      borderRadius: isMobile ? 14 : 18,
      marginBottom: isMobile ? 10 : 18,
    },

    cardMini: {
      background: "#111",
      padding: isMobile ? 10 : 14,
      borderRadius: 14,
      marginBottom: isMobile ? 10 : 14,
    },

    input: {
      width: "100%",
      padding: isMobile ? 10 : 13,
      marginBottom: isMobile ? 8 : 12,
      borderRadius: 8,
      border: "1px solid #333",
      fontSize: isMobile ? 14 : 16,
      boxSizing: "border-box",
    },

    button: {
      width: "100%",
      padding: isMobile ? 12 : 14,
      borderRadius: 10,
      background: "#00ff99",
      border: "none",
      fontWeight: "bold",
      fontSize: isMobile ? 15 : 16,
      marginTop: 4,
    },

    redButton: {
      width: "100%",
      padding: 10,
      borderRadius: 10,
      background: "#ff4444",
      color: "#fff",
      border: "none",
      fontWeight: "bold",
      marginBottom: 8,
    },

    grayButton: {
      width: "100%",
      padding: 10,
      borderRadius: 10,
      background: "#333",
      color: "#fff",
      border: "none",
      fontWeight: "bold",
      marginBottom: 8,
    },

    menuButton: {
      background: "#00ff99",
      color: "#000",
      border: "none",
      borderRadius: 10,
      padding: "8px 12px",
      fontWeight: "bold",
      fontSize: 18,
    },

    logoutSmall: {
      background: "#ff4444",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      padding: isMobile ? "8px 10px" : "10px 16px",
      fontWeight: "bold",
      fontSize: isMobile ? 13 : 15,
    },

    calendar: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: isMobile ? 5 : 7,
    },

    day: {
      padding: isMobile ? 7 : 10,
      borderRadius: 8,
      border: "1px solid #333",
      fontWeight: "bold",
      fontSize: isMobile ? 12 : 14,
    },

    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: isMobile ? 6 : 10,
    },

    checkRow: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      marginBottom: 10,
    },

    waitingItem: {
      borderBottom: "1px solid #333",
      padding: "7px 0",
      fontSize: isMobile ? 13 : 14,
    },

    tableWrap: {
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: isMobile ? 980 : 1180,
      fontSize: isMobile ? 12 : 14,
    },

    smallGreen: {
      background: "#00ff99",
      color: "#000",
      border: "none",
      borderRadius: 8,
      padding: isMobile ? "5px 8px" : "7px 11px",
      fontWeight: "bold",
      marginRight: 5,
      fontSize: isMobile ? 12 : 13,
    },

    smallRed: {
      background: "#ff4444",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: isMobile ? "5px 8px" : "7px 11px",
      fontWeight: "bold",
      fontSize: isMobile ? 12 : 13,
    },

    gray: {
      color: "#aaa",
    },
  };
}
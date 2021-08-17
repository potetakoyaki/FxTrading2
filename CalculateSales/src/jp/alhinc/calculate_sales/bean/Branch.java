package jp.alhinc.calculate_sales.bean;

public class Branch {

	/** 支店コード */
	private String code;
	/** 支店名 */
	private String name;
	/** 金額 */
	private Long amount;

	public Branch(String code, String name) {
		this.code = code;
		this.name = name;
		this.amount = 0L;
	}

	@Override
	public String toString() {
		return String.format("%s,%s,%s", code, name, amount);
	}

	/**
	 * 支店コードを返す
	 *
	 * @return code 支店コード
	 */
	public String getCode() {
		return code;
	}

	/**
	 * 支店コードをセットする
	 *
	 * @param code
	 *            支店コード
	 */
	public void setCode(String code) {
		this.code = code;
	}

	/**
	 * 支店名を返す
	 *
	 * @return name 支店名
	 */
	public String getName() {
		return name;
	}

	/**
	 * 支店名をセットする
	 *
	 * @param name
	 *            支店名
	 */
	public void setName(String name) {
		this.name = name;
	}

	/**
	 * 金額を返す
	 *
	 * @return amount 金額
	 */
	public Long getAmount() {
		return amount;
	}
	
	/**
	 * 金額を加算する
	 * 
	 * @param amount
	 *            金額
	 */
	public void addAmount(Long amount) {
		this.amount += amount;
	}
}

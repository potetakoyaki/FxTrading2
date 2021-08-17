package jp.alhinc.calculate_sales;

import jp.alhinc.calculate_sales.bean.Branches;
import jp.alhinc.calculate_sales.service.LoadDefinitionFileService;
import jp.alhinc.calculate_sales.service.SummaryService;
import jp.alhinc.calculate_sales.service.WriteResultFileService;

public class App {

	public static void main(String[] args) {

		try {
			if (!LoadDefinitionFileService.existsBranchDefinitionFile(args[0])) {
				System.out.println("TODO: message");
				return;
			}

			Branches branches = LoadDefinitionFileService.load(args[0]);

			if (branches.hasError()) {
				System.out.println("TODO: message");
				return;
			}

			Branches summarizedBranches = SummaryService.summarize(args[0], branches);

			if (summarizedBranches.hasError()) {
				System.out.println("TODO: message");
				return;
			}

			WriteResultFileService.write(args[0], summarizedBranches);

		} catch (Exception e) {
			System.out.println("TODO: message");
			return;
		}

	}

}

<?php

namespace SilverStripe\CMS\Tests\Reports;

use SilverStripe\Dev\SapphireTest;
use SilverStripe\CMS\Reports\BrokenLinksReport;
use SilverStripe\CMS\Model\SiteTree;

class BrokenLinksReportTest extends SapphireTest
{
    public function testXssEscaped()
    {
        // This is an edge case test as Link and AbsoluteLink need to be overridden in a subclass
        // for there to be any vulnerability to XSS in the BrokenLinksReport
        // By default, HTML tags are removed from SiteTree.URLSegment by URLSegmentFilter
        // during SiteTree::onBeforeWrite() so there is no XSS vulnerability in the default implementation
        $record = new class() extends SiteTree {
            public function Link($action = null)
            {
                return "<script>alert('xss-link');</script>";
            }

            public function AbsoluteLink($action = null)
            {
                return "<script>alert('xss-abs-link');</script>";
            }
        };
        $report = new BrokenLinksReport();
        /** @var GridField $gridField */
        $gridField = $report->getReportField();
        $this->assertSame(
            '&lt;script&gt;alert(&#039;xss-abs-link&#039;);&lt;/script&gt; <a href="&lt;script&gt;'
            . 'alert(&?stage=Stage#039;xss-abs-link&#039;);&lt;/script&gt;">(draft)</a>',
            $gridField->getColumnContent($record, 'AbsoluteLink')
        );
    }
}
